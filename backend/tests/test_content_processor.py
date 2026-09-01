"""
Unit tests for content_processor URL deduplication logic.
Tests _dedupe_by_url() without requiring API calls.
"""

import pytest
from agents.content_processor import _dedupe_by_url
from schemas.schema import SearchResult


def _make_result(url: str, title: str = "Title", query_id: str = "q1", sq_id: str = "sq_1") -> SearchResult:
    """Helper to create a SearchResult with minimal boilerplate."""
    return SearchResult(
        search_query_id=query_id,
        sub_question_id=sq_id,
        url=url,
        title=title,
        content="Some content here.",
        score=0.9,
    )


class TestDedupeByUrl:
    """Tests for URL-based deduplication of search results."""

    def test_no_duplicates_returns_all(self):
        results = [
            _make_result("https://a.com"),
            _make_result("https://b.com"),
            _make_result("https://c.com"),
        ]
        deduped = _dedupe_by_url(results)
        assert len(deduped) == 3

    def test_duplicate_urls_kept_only_once(self):
        results = [
            _make_result("https://a.com", title="First"),
            _make_result("https://b.com"),
            _make_result("https://a.com", title="Second"),
        ]
        deduped = _dedupe_by_url(results)
        assert len(deduped) == 2
        # First occurrence should be kept
        assert deduped[0].title == "First"
        assert deduped[1].url == "https://b.com"

    def test_all_same_url_returns_one(self):
        results = [_make_result("https://same.com") for _ in range(5)]
        deduped = _dedupe_by_url(results)
        assert len(deduped) == 1

    def test_empty_list_returns_empty(self):
        assert _dedupe_by_url([]) == []

    def test_single_result_returns_same(self):
        results = [_make_result("https://only.com")]
        deduped = _dedupe_by_url(results)
        assert len(deduped) == 1
        assert deduped[0].url == "https://only.com"

    def test_preserves_order(self):
        results = [
            _make_result("https://c.com"),
            _make_result("https://a.com"),
            _make_result("https://b.com"),
            _make_result("https://a.com"),  # duplicate
        ]
        deduped = _dedupe_by_url(results)
        assert [r.url for r in deduped] == [
            "https://c.com",
            "https://a.com",
            "https://b.com",
        ]
