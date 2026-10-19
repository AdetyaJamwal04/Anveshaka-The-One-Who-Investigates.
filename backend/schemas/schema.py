from pydantic import BaseModel, Field
from typing import List, Literal

class QuerySynthesis(BaseModel):
    original_query: str

    intent: str
    objective: str

    query_architecture: Literal[
        "single_question",
        "multi_question"
    ]

    scope: Literal[
        "narrow",
        "moderate",
        "broad"
    ]

    entities: list[str]

    ambiguity: bool
    ambiguity_reason: str

class SubQuestion(BaseModel):
    id: str
    text: str
    priority: int
    parent_intent: str
    parent_entities: list[str] = Field(default_factory=list)

class SearchQuery(BaseModel):
    id: str                                          # e.g. "sq_1_q1"
    sub_question_id: str                             # FK back to its SubQuestion
    query_string: str
    angle: str
    status: Literal["pending", "executed", "failed"] = "pending"
    round: int = 1
    
class SearchResult(BaseModel):
    search_query_id: str
    sub_question_id: str
    url: str
    title: str
    content: str
    score: float = 0.0
    provider: str = "tavily"
    
class Evidence(BaseModel):
    sub_question_id: str
    claim: str
    source_url: str
    source_title: str

class SubQuestionVerdict(BaseModel):
    sub_question_id: str
    verdict: Literal["sufficient", "needs_more"]
    gap: str                                        # what's missing (empty if sufficient)
    suggested_angles: list[str] = []                # new search angles to try (empty if sufficient)


class ResearchRecord(BaseModel):
    id: str
    query: str
    report_markdown: str
    intent: str = "research"
    architecture: str = "multi_question"
    scope: str = "moderate"
    entities: list[str] = Field(default_factory=list)
    sub_questions: list[str] = Field(default_factory=list)
    sources_count: int = 0
    claims_count: int = 0
    rounds_executed: int = 1
    created_at: str
    read_time_minutes: int = 1
