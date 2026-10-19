from graph import should_continue
from schemas.schema import QuerySynthesis, SubQuestionVerdict

def test_fast_track_bypasses_extra_rounds():
    # Narrow single-question queries should immediately exit to report after round 1
    synthesis = QuerySynthesis(
        original_query="What is Amdahl's Law?",
        intent="explanation",
        objective="Define Amdahl's Law",
        query_architecture="single_question",
        scope="narrow",
        entities=["Amdahl's Law"],
        ambiguity=False,
        ambiguity_reason="",
    )
    
    state = {
        "synthesis": synthesis,
        "round_num": 1,
        "verdicts": [SubQuestionVerdict(sub_question_id="sq_1", verdict="needs_more", gap="more examples", suggested_angles=[])],
    }
    
    # Even if verdict was needs_more, fast-track narrow single-questions route to report
    assert should_continue(state) == "report"

def test_deep_track_iterates_when_gaps_exist():
    # Multi-question broad queries should loop when coverage is incomplete
    synthesis = QuerySynthesis(
        original_query="Compare PostgreSQL and SQLite in depth",
        intent="comparison",
        objective="Compare relational engines",
        query_architecture="multi_question",
        scope="broad",
        entities=["PostgreSQL", "SQLite"],
        ambiguity=False,
        ambiguity_reason="",
    )
    
    state = {
        "synthesis": synthesis,
        "round_num": 1,
        "verdicts": [SubQuestionVerdict(sub_question_id="sq_1", verdict="needs_more", gap="concurrency metrics", suggested_angles=[])],
    }
    
    assert should_continue(state) == "generate_queries"
