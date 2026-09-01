"""
Unit tests for search_query_generator coverage fill logic.
Tests _coverage_check_and_fill() without requiring API calls.
"""

import pytest
from agents.search_query_generator import _coverage_check_and_fill, _RawSearchQuery
from schemas.schema import SubQuestion


def _make_sub_question(sq_id: str) -> SubQuestion:
    return SubQuestion(
        id=sq_id,
        text=f"Question for {sq_id}",
        priority=1,
        parent_intent="analysis",
        parent_entities=[],
    )


def _make_raw_query(sq_id: str, query_string: str = "test query") -> _RawSearchQuery:
    return _RawSearchQuery(
        sub_question_id=sq_id,
        query_string=query_string,
        angle="test",
    )


class TestCoverageCheckAndFill:
    """Tests for the fallback fill mechanism."""

    def test_all_covered_no_fill(self):
        """If all sub-questions have queries, no fills should be added."""
        sqs = [_make_sub_question("sq_1"), _make_sub_question("sq_2")]
        queries = [_make_raw_query("sq_1"), _make_raw_query("sq_2")]
        result = _coverage_check_and_fill(sqs, queries)
        assert len(result) == 2

    def test_missing_sub_question_gets_fallback(self):
        """If a sub-question has no queries, it should get a fallback."""
        sqs = [_make_sub_question("sq_1"), _make_sub_question("sq_2")]
        queries = [_make_raw_query("sq_1")]
        result = _coverage_check_and_fill(sqs, queries)
        assert len(result) == 2
        
        fallback = [q for q in result if q.sub_question_id == "sq_2"]
        assert len(fallback) == 1
        assert fallback[0].angle == "fallback"
        assert fallback[0].query_string == "Question for sq_2"

    def test_no_queries_at_all(self):
        """If the LLM returned nothing, every sub-question gets a fallback."""
        sqs = [_make_sub_question("sq_1"), _make_sub_question("sq_2"), _make_sub_question("sq_3")]
        result = _coverage_check_and_fill(sqs, [])
        assert len(result) == 3
        assert all(q.angle == "fallback" for q in result)

    def test_existing_queries_preserved(self):
        """Fallback fill should not modify or remove existing queries."""
        sqs = [_make_sub_question("sq_1"), _make_sub_question("sq_2")]
        original_query = _make_raw_query("sq_1", "specific search string")
        result = _coverage_check_and_fill(sqs, [original_query])
        
        sq1_queries = [q for q in result if q.sub_question_id == "sq_1"]
        assert len(sq1_queries) == 1
        assert sq1_queries[0].query_string == "specific search string"

    def test_multiple_queries_per_sub_question(self):
        """Sub-questions with multiple queries should not get fallbacks."""
        sqs = [_make_sub_question("sq_1")]
        queries = [
            _make_raw_query("sq_1", "query one"),
            _make_raw_query("sq_1", "query two"),
            _make_raw_query("sq_1", "query three"),
        ]
        result = _coverage_check_and_fill(sqs, queries)
        assert len(result) == 3
        assert not any(q.angle == "fallback" for q in result)
