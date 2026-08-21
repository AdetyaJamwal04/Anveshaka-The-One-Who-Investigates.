import asyncio
from typing import List
from pydantic import BaseModel
from schemas.schema import SubQuestionVerdict
from models.model import chat
from agents.knowledge_store import KnowledgeStore


class VerdictBatch(BaseModel):
    """
    Container schema for structured output. Same pattern as SubQuestionList
    and SearchQueryBatch — binding to the list container rather than a single
    verdict so the LLM returns one verdict per sub-question.
    """
    verdicts: List[SubQuestionVerdict]


SYSTEM_PROMPT = """You are a rigorous research evaluator and scientific auditor. You will be given a set of sub-questions alongside the accumulated evidence claims for each.

Your job is to rigorously determine whether the evidence collected is genuinely SUFFICIENT to produce an exhaustive, authoritative, and deep analysis, or whether MORE targeted searching is required.

Evaluation Criteria:
- "sufficient":
  1. High empirical depth: Evidence includes concrete mechanisms, quantitative figures (statistics, percentages, metrics, dates), or detailed causal explanations.
  2. Multi-source triangulation: Evidence is drawn from multiple distinct sources.
  3. Comprehensive facet coverage: All critical sub-facets of the sub-question (e.g. underlying mechanisms, real-world data, risks/limitations, edge cases) are directly supported.
  4. Non-triviality: The evidence goes well beyond high-level definitions or surface-level summaries.

- "needs_more":
  Mark "needs_more" if ANY of the following apply:
  1. Low claim volume (< 4 substantive claims) or shallow source reliance.
  2. Superficiality: Claims only state high-level conclusions without providing underlying evidence, mechanisms, numbers, or methodology.
  3. Key Blindspots: Crucial dimensions (e.g., quantitative benchmarks, long-term impacts, comparative data, clinical trials, adverse effects) remain unaddressed.
  4. Conflicting claims without adequate context to resolve them.

Guidance for "needs_more":
- "gap": Clearly describe the exact missing evidence, data point, or mechanism.
- "suggested_angles": Provide 2 to 4 highly specific, targeted search angles (e.g., using technical terminology, specific studies, industry reports, or comparative metrics) to directly resolve the gap.

Rules:
- Be rigorous: Do not prematurely mark sub-questions as "sufficient" if only basic definitions or promotional summaries have been found.
- Every sub_question_id must appear in your output. Do not skip any.
"""

USER_PROMPT_TEMPLATE = """Evaluate the evidence coverage for each sub-question below.

{coverage_block}
"""


def _build_coverage_block(store: KnowledgeStore) -> str:
    """
    Builds the prompt block that shows each sub-question and its collected
    evidence to the reflection LLM.
    """
    blocks = []
    for sq in store.sub_questions:
        evidence_text = store.evidence_summary_for(sq.id)
        count = store.evidence_count(sq.id)
        queries_used = len(store.queries_for(sq.id))

        blocks.append(
            f"[{sq.id}] Sub-question: {sq.text}\n"
            f"Queries used so far: {queries_used}\n"
            f"Evidence claims ({count}):\n"
            f"{evidence_text}"
        )

    return "\n\n".join(blocks)


async def reflect(store: KnowledgeStore) -> List[SubQuestionVerdict]:
    """
    Main entry point. Takes the knowledge store and returns a verdict
    per sub-question via a single batched LLM call.
    """
    coverage_block = _build_coverage_block(store)
    user_prompt = USER_PROMPT_TEMPLATE.format(coverage_block=coverage_block)

    for attempt in range(5):
        try:
            result = await chat.with_structured_output(VerdictBatch).ainvoke(
                [
                    ("system", SYSTEM_PROMPT),
                    ("user", user_prompt),
                ]
            )
            return result.verdicts
        except Exception as e:
            print(f"[reflection] LLM call failed (attempt {attempt+1}/5): {e}")
            if attempt < 4:
                await asyncio.sleep(2 ** attempt)
            else:
                # On failure, mark everything as sufficient to avoid infinite loops
                return [
                    SubQuestionVerdict(
                        sub_question_id=sq.id,
                        verdict="sufficient",
                        gap="",
                        suggested_angles=[],
                    )
                    for sq in store.sub_questions
                ]
    
    # Fallback
    return [
        SubQuestionVerdict(
            sub_question_id=sq.id,
            verdict="sufficient",
            gap="",
            suggested_angles=[],
        )
        for sq in store.sub_questions
    ]
