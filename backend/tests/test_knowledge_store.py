"""
Unit tests for KnowledgeStore accessors, mutators, and summaries.
Tests pure in-memory logic without requiring API calls.
"""

import pytest
from agents.knowledge_store import KnowledgeStore
from schemas.schema import SubQuestion, SearchQuery, Evidence


def _make_sub_questions(count: int = 3) -> list[SubQuestion]:
    return [
        SubQuestion(
            id=f"sq_{i+1}",
            text=f"Sub-question {i+1}",
            priority=i + 1,
            parent_intent="analysis",
            parent_entities=["entity_a"],
        )
        for i in range(count)
    ]


def _make_evidence(sub_question_id: str, claim: str = "Test claim", url: str = "https://example.com") -> Evidence:
    return Evidence(
        sub_question_id=sub_question_id,
        claim=claim,
        source_url=url,
        source_title="Example Source",
    )


def _make_query(sub_question_id: str, query_string: str = "test query", status: str = "executed") -> SearchQuery:
    return SearchQuery(
        id=f"{sub_question_id}_q1",
        sub_question_id=sub_question_id,
        query_string=query_string,
        angle="test",
        status=status,
    )


class TestKnowledgeStoreAccessors:
    """Tests for reading evidence and query data."""

    def test_evidence_for_returns_matching(self):
        sqs = _make_sub_questions(2)
        store = KnowledgeStore(sqs)
        store.add_evidence([
            _make_evidence("sq_1", "Claim A"),
            _make_evidence("sq_2", "Claim B"),
            _make_evidence("sq_1", "Claim C"),
        ])
        assert len(store.evidence_for("sq_1")) == 2
        assert len(store.evidence_for("sq_2")) == 1

    def test_evidence_count(self):
        sqs = _make_sub_questions(2)
        store = KnowledgeStore(sqs)
        store.add_evidence([_make_evidence("sq_1")] * 5)
        assert store.evidence_count("sq_1") == 5
        assert store.evidence_count("sq_2") == 0

    def test_has_zero_evidence(self):
        sqs = _make_sub_questions(3)
        store = KnowledgeStore(sqs)
        store.add_evidence([_make_evidence("sq_1")])
        zero = store.has_zero_evidence()
        zero_ids = [sq.id for sq in zero]
        assert "sq_2" in zero_ids
        assert "sq_3" in zero_ids
        assert "sq_1" not in zero_ids

    def test_has_zero_evidence_all_covered(self):
        sqs = _make_sub_questions(2)
        store = KnowledgeStore(sqs)
        store.add_evidence([
            _make_evidence("sq_1"),
            _make_evidence("sq_2"),
        ])
        assert store.has_zero_evidence() == []

    def test_queries_for(self):
        sqs = _make_sub_questions(2)
        store = KnowledgeStore(sqs)
        store.add_queries([
            _make_query("sq_1", "query one"),
            _make_query("sq_1", "query two"),
            _make_query("sq_2", "query three"),
        ])
        assert len(store.queries_for("sq_1")) == 2
        assert len(store.queries_for("sq_2")) == 1

    def test_previously_searched_strings(self):
        sqs = _make_sub_questions(1)
        store = KnowledgeStore(sqs)
        store.add_queries([
            _make_query("sq_1", "alpha query"),
            _make_query("sq_1", "beta query"),
        ])
        searched = store.previously_searched_strings()
        assert searched == {"alpha query", "beta query"}


class TestKnowledgeStoreMutators:
    """Tests for adding data to the store."""

    def test_add_queries_appends(self):
        sqs = _make_sub_questions(1)
        store = KnowledgeStore(sqs)
        assert len(store.search_queries) == 0
        store.add_queries([_make_query("sq_1")])
        assert len(store.search_queries) == 1
        store.add_queries([_make_query("sq_1"), _make_query("sq_1")])
        assert len(store.search_queries) == 3

    def test_add_evidence_appends(self):
        sqs = _make_sub_questions(1)
        store = KnowledgeStore(sqs)
        assert len(store.evidence) == 0
        store.add_evidence([_make_evidence("sq_1")])
        assert len(store.evidence) == 1


class TestKnowledgeStoreSummaries:
    """Tests for human-readable summary outputs."""

    def test_coverage_summary_format(self):
        sqs = _make_sub_questions(2)
        store = KnowledgeStore(sqs)
        store.add_evidence([_make_evidence("sq_1")])
        store.add_queries([_make_query("sq_1", status="executed")])
        
        summary = store.coverage_summary()
        assert "sq_1" in summary
        assert "sq_2" in summary
        assert "Evidence claims: 1" in summary

    def test_evidence_summary_for_empty(self):
        sqs = _make_sub_questions(1)
        store = KnowledgeStore(sqs)
        assert store.evidence_summary_for("sq_1") == "No evidence collected."

    def test_evidence_summary_for_with_data(self):
        sqs = _make_sub_questions(1)
        store = KnowledgeStore(sqs)
        store.add_evidence([_make_evidence("sq_1", "Important finding")])
        summary = store.evidence_summary_for("sq_1")
        assert "Important finding" in summary
        assert "Example Source" in summary
