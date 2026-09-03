import re
import asyncio
import os
from typing import List
from schemas.schema import SearchQuery, SearchResult
from models.web_client import client as tavily_client

TAVILY_SEMAPHORE = asyncio.Semaphore(10)
DEFAULT_SEARCH_DEPTH = os.getenv("TAVILY_SEARCH_DEPTH", "basic")

_MARKDOWN_LINK_PATTERN = re.compile(r"!?\[[^\]]*\]\([^)]*\)")

_PDF_ARTIFACT_MARKERS = (
    "endobj", "endstream", "<rdf:rdf>", "xmpmeta",
    "<pdf:producer>", "extensisfontsense", "<xmp:createdate>",
)


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


async def _execute_single_query(query_string: str, max_results: int = 5, search_depth: str = None) -> dict:
    """
    Calls Tavily for a single query string and returns the raw response dict.
    Defaults to fast 'basic' search depth for 10x retrieval speed.
    """
    depth = search_depth or DEFAULT_SEARCH_DEPTH
    async with TAVILY_SEMAPHORE:
        try:
            return await tavily_client.search(
                query=query_string,
                search_depth=depth,
                max_results=max_results,
            )
        except Exception as e:
            print(f"[search_executor] Search error for '{query_string}' ({e}), retrying basic...")
            return await tavily_client.search(
                query=query_string,
                search_depth="basic",
                max_results=max_results,
            )


async def execute_and_clean_searches(
    search_queries: List[SearchQuery],
    max_results: int = 5,
) -> List[SearchResult]:
    """
    Main entry point. For each SearchQuery:
      1. Calls Tavily with its query_string
      2. Filters out low-quality/junk results
      3. Maps surviving results into SearchResult objects
      4. Updates SearchQuery.status to "executed" or "failed" in place
    """
    results: List[SearchResult] = []

    async def fetch_and_process(sq: SearchQuery):
        try:
            response = await _execute_single_query(sq.query_string, max_results=max_results)
        except Exception as e:
            print(f"[search_executor] Tavily search failed for '{sq.query_string}': {e}")
            sq.status = "failed"
            return []

        raw_results = response.get("results", [])

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
            local_results.append(
                SearchResult(
                    search_query_id=sq.id,
                    sub_question_id=sq.sub_question_id,
                    url=item.get("url", ""),
                    title=item.get("title", ""),
                    content=content,
                    score=item.get("score", 0.0),
                )
            )

        sq.status = "executed" if survived_count > 0 else "failed"
        return local_results

    tasks = [fetch_and_process(sq) for sq in search_queries]
    batch_results = await asyncio.gather(*tasks)

    for sublist in batch_results:
        results.extend(sublist)

    return results
