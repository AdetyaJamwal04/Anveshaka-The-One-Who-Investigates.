"""
Report Synthesizer Agent.

Transforms raw, multi-round evidence claims into a comprehensive,
authoritative, and beautifully formatted research report with inline citations.
"""

from typing import Dict, Tuple
import asyncio
from models.model import chat
from agents.knowledge_store import KnowledgeStore

SYSTEM_PROMPT = """You are a Principal Research Analyst and Domain Synthesis Specialist. Your job is to transform raw, extracted evidence claims into a comprehensive, authoritative, and deeply analytical research report.

Report Structure & Quality Requirements:

1. Title: Create an informative, authoritative title reflecting the core research inquiry.

2. Executive Summary:
   - High-level analytical overview synthesizing the primary findings.
   - "Key Takeaways" bullet points highlighting the most impactful conclusions.

3. Detailed Thematic Sections:
   - Structure the body of the report around logical themes derived from the research facets.
   - Use clear descriptive subheadings (###) to organize multi-dimensional topics.
   - Write in rich, flowing, multi-paragraph prose. Thoroughly unpack the evidence: explain mechanisms, causal chains, empirical statistics, and real-world implications.
   - Incorporate Markdown comparison or summary tables whenever data involves comparative attributes, numerical benchmarks, chemical/nutritional breakdowns, timelines, or trade-offs.
   - Contextualize Nuances & Limitations: If evidence on a specific sub-facet is sparse in public literature, analyze why (e.g., regulatory constraints, emerging technology phase, lack of longitudinal clinical trials) rather than simply stating data is absent.

4. Strategic Conclusion & Outlook:
   - Synthesize the overarching findings, trade-offs, and future trajectory of the topic.

5. Rigorous Inline Citations:
   - You MUST use inline citations (e.g., [1], [2]) whenever stating facts, metrics, or claims derived from the evidence.
   - Every substantive assertion must be directly grounded in its citation source.

6. References Section:
   - Provide a clean, numbered list of references at the end matching the provided Source Mapping.

Formatting & Tone:
- Maintain an authoritative, strictly objective, and analytically rigorous tone.
- Avoid Inherent Bias & Promotional Language: Strip away marketing hype, sensationalism, and loaded rhetoric. Present findings neutrally.
- Balanced Perspectives: Where topics involve debates, commercial competition, trade-offs, or conflicting evidence, represent all major viewpoints with proportionate empirical weight.
- Objective Attribution of Disputed Claims: When assertions are qualitative, contested, or commercially motivated, explicitly attribute them to their source (e.g., "According to [1]...", "Conversely, critics argue [2]...") rather than stating them as indisputable facts.
- Depth & Substance: Avoid superficial 1-paragraph summaries. Provide depth, nuance, and clarity.
"""

def _build_evidence_block(store: KnowledgeStore) -> Tuple[str, Dict[str, Tuple[str, int]]]:
    """
    Builds the formatted evidence block for the prompt and generates a 
    consistent mapping of URLs to citation IDs (e.g., [1]) and source titles.
    """
    url_to_info: Dict[str, Tuple[str, int]] = {}
    next_id = 1
    
    blocks = []
    for sq in store.sub_questions:
        claims = store.evidence_for(sq.id)
        if not claims:
            continue
            
        blocks.append(f"### Research Facet: {sq.text}")
        for claim in claims:
            url = claim.source_url
            title = claim.source_title or "Web Source"
            if url not in url_to_info:
                url_to_info[url] = (title, next_id)
                next_id += 1
            
            _, citation_id = url_to_info[url]
            blocks.append(f"- {claim.claim} [{citation_id}]")
        blocks.append("")
        
    return "\n".join(blocks), url_to_info


def _extract_text_content(content) -> str:
    """Ensures LLM output is always returned as a clean markdown string."""
    if isinstance(content, list):
        return "".join(
            p.get("text", str(p)) if isinstance(p, dict) else getattr(p, "text", str(p))
            for p in content
        )
    return content if isinstance(content, str) else str(content)

async def synthesize_report(query: str, store: KnowledgeStore) -> str:
    """
    Takes the accumulated knowledge and generates a final markdown report.
    """
    evidence_block, url_to_info = _build_evidence_block(store)
    
    sorted_sources = sorted(url_to_info.items(), key=lambda x: x[1][1])
    mapping_block = "\n".join([f"[{info[1]}] {info[0]} - {url}" for url, info in sorted_sources])
    
    user_prompt = f"""Original Research Inquiry: {query}

Accumulated Evidence by Theme:
{evidence_block}

Source Mapping:
{mapping_block}

Please generate the exhaustive, highly structured, and fully cited research report now.
"""

    for attempt in range(5):
        try:
            response = await chat.ainvoke(
                [
                    ("system", SYSTEM_PROMPT),
                    ("user", user_prompt),
                ]
            )
            return _extract_text_content(response.content)
        except Exception as e:
            print(f"[report_synthesizer] LLM call failed (attempt {attempt+1}/5): {e}")
            if attempt < 4:
                await asyncio.sleep(2 ** attempt)
    
    return f"# Error generating report\n\nFailed to synthesize report after multiple attempts."

