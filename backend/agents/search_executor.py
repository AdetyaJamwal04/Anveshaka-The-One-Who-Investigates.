import re
import asyncio
import os
import urllib.request
import urllib.parse
import html
from typing import List, Dict, Any
from schemas.schema import SearchQuery, SearchResult
from tavily import AsyncTavilyClient

tavily_client = AsyncTavilyClient()

TAVILY_SEMAPHORE = asyncio.Semaphore(10)
DEFAULT_SEARCH_DEPTH = os.getenv("TAVILY_SEARCH_DEPTH", "basic")

_MARKDOWN_LINK_PATTERN = re.compile(r"!?\[[^\]]*\]\([^)]*\)")

_PDF_ARTIFACT_MARKERS = (
    "endobj", "endstream", "<rdf:rdf>", "xmpmeta",
    "<pdf:producer>", "extensisfontsense", "<xmp:createdate>",
)

# Tracking parameters to strip for clean canonical URLs
_TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "gclid", "fbclid", "msclkid", "ref", "mc_cid", "mc_eid"
}

# High authority domain suffixes / keywords
_AUTHORITY_DOMAINS = (
    ".edu", ".gov", ".org", "arxiv.org", "nature.com", "science.org",
    "ieee.org", "acm.org", "github.com", "wikipedia.org", "nih.gov", "cdc.gov"
)


def _canonicalize_url(url: str) -> str:
    """Strips marketing/tracking query parameters for deduplication and link hygiene."""
    try:
        parsed = urllib.parse.urlparse(url)
        if not parsed.query:
            return url
        query_dict = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
        clean_query = {k: v for k, v in query_dict.items() if k.lower() not in _TRACKING_PARAMS}
        new_query = urllib.parse.urlencode(clean_query, doseq=True)
        return urllib.parse.urlunparse(parsed._replace(query=new_query))
    except Exception:
        return url


def _compute_authority_score(url: str, base_score: float = 0.5) -> float:
    """Calculates an authority score heuristic based on domain credentials."""
    lowered = url.lower()
    score = base_score
    if any(auth in lowered for auth in _AUTHORITY_DOMAINS):
        score += 0.3
    return min(1.0, round(score, 2))


def _is_low_quality_content(
    content: str,
    min_length: int = 200,
    max_link_coverage: float = 0.3,
    min_alpha_ratio: float = 0.6,
) -> bool:
    """
    Flags content that's unusable for downstream synthesis.
    """
    if not content or len(content) < min_length:
        return True

    lowered = content.lower()
    if any(marker in lowered for marker in _PDF_ARTIFACT_MARKERS):
        return True

    link_matches = _MARKDOWN_LINK_PATTERN.findall(content)
    link_chars = sum(len(m) for m in link_matches)
    if link_chars / len(content) > max_link_coverage:
        return True

    alpha_chars = sum(1 for c in content if c.isalpha())
    if alpha_chars / len(content) < min_alpha_ratio:
        return True

    return False


async def _execute_ddg_fallback(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Zero-key resilient web search fallback using DuckDuckGo.
    Guarantees research continuity when third-party search credits are depleted or fail.
    """
    def _fetch_sync():
        data = urllib.parse.urlencode({"q": query}).encode()
        req = urllib.request.Request(
            "https://lite.duckduckgo.com/lite/",
            data=data,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded",
            }
        )
        results = []
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                page = resp.read().decode("utf-8", errors="ignore")
                link_pattern = re.compile(r'<a[^>]+href="([^"]+)"[^>]+class=(?:\'|")result-link(?:\'|")[^>]*>([\s\S]*?)</a>')
                snip_pattern = re.compile(r'<td[^>]+class=(?:\'|")result-snippet(?:\'|")[^>]*>([\s\S]*?)</td>')
                links = link_pattern.findall(page)
                snippets = snip_pattern.findall(page)
                for (url, raw_title), raw_snip in zip(links, snippets):
                    if "duckduckgo.com" in url:
                        continue
                    clean_title = re.sub(r'<[^>]+>', '', raw_title).strip()
                    clean_snip = re.sub(r'<[^>]+>', '', raw_snip).strip()
                    results.append({
                        "url": url,
                        "title": html.unescape(clean_title),
                        "content": html.unescape(clean_snip),
                        "score": 0.6,
                        "provider": "duckduckgo",
                    })
                    if len(results) >= max_results:
                        break
            return results
        except Exception as e:
            print(f"[search_executor] DuckDuckGo fallback error for '{query}': {e}")
            return []

    return await asyncio.to_thread(_fetch_sync)


async def _execute_single_query(query_string: str, max_results: int = 5, search_depth: str = None) -> List[Dict[str, Any]]:
    """
    Executes search with primary Tavily provider and automated DuckDuckGo fallback.
    """
    depth = search_depth or DEFAULT_SEARCH_DEPTH
    raw_results = []

    # 1. Primary: Tavily Search
    async with TAVILY_SEMAPHORE:
        try:
            resp = await tavily_client.search(
                query=query_string,
                search_depth=depth,
                max_results=max_results,
            )
            raw_results = resp.get("results", [])
            for r in raw_results:
                r["provider"] = "tavily"
        except Exception as e:
            print(f"[search_executor] Tavily primary search error for '{query_string}' ({e}), testing basic retry...")
            try:
                resp = await tavily_client.search(
                    query=query_string,
                    search_depth="basic",
                    max_results=max_results,
                )
                raw_results = resp.get("results", [])
                for r in raw_results:
                    r["provider"] = "tavily"
            except Exception as e2:
                print(f"[search_executor] Tavily retries exhausted for '{query_string}': {e2}")

    # 2. Automated Fallback: DuckDuckGo if primary returned 0 results
    if not raw_results:
        print(f"[search_executor] Activating resilient DuckDuckGo search fallback for '{query_string}'...")
        raw_results = await _execute_ddg_fallback(query_string, max_results=max_results)

    return raw_results


async def execute_and_clean_searches(
    search_queries: List[SearchQuery],
    max_results: int = 5,
) -> List[SearchResult]:
    """
    Main entry point. For each SearchQuery:
      1. Calls primary/fallback search providers
      2. Canonicalizes URLs and filters out low-quality/junk results
      3. Computes domain authority scores
      4. Maps surviving results into SearchResult objects
      5. Updates SearchQuery.status to "executed" or "failed" in place
    """
    results: List[SearchResult] = []

    async def fetch_and_process(sq: SearchQuery):
        try:
            raw_results = await _execute_single_query(sq.query_string, max_results=max_results)
        except Exception as e:
            print(f"[search_executor] All search providers failed for '{sq.query_string}': {e}")
            sq.status = "failed"
            return []

        if not raw_results:
            sq.status = "failed"
            return []

        survived_count = 0
        local_results = []
        for item in raw_results:
            content = item.get("content", "") or ""

            if _is_low_quality_content(content):
                continue

            survived_count += 1
            clean_url = _canonicalize_url(item.get("url", ""))
            authority_score = _compute_authority_score(clean_url, base_score=item.get("score", 0.5))

            local_results.append(
                SearchResult(
                    search_query_id=sq.id,
                    sub_question_id=sq.sub_question_id,
                    url=clean_url,
                    title=item.get("title", ""),
                    content=content,
                    score=authority_score,
                    provider=item.get("provider", "tavily"),
                )
            )

        sq.status = "executed" if survived_count > 0 else "failed"
        return local_results

    tasks = [fetch_and_process(sq) for sq in search_queries]
    batch_results = await asyncio.gather(*tasks)

    for sublist in batch_results:
        results.extend(sublist)

    return results
