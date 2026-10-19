"""
Unit tests for search_executor quality filtering logic.
Tests _is_low_quality_content() without requiring API calls.
"""

import pytest
from agents.search_executor import _is_low_quality_content


class TestIsLowQualityContent:
    """Tests for the content quality filter."""

    def test_empty_content_is_low_quality(self):
        assert _is_low_quality_content("") is True
        assert _is_low_quality_content(None) is True

    def test_short_content_is_low_quality(self):
        assert _is_low_quality_content("Too short.") is True
        assert _is_low_quality_content("a" * 199) is True

    def test_sufficient_length_passes(self):
        content = "This is a well-written article about machine learning. " * 20
        assert _is_low_quality_content(content) is False

    def test_pdf_artifact_markers_detected(self):
        """Content with PDF internal structure tokens should be flagged."""
        content = "a" * 300 + " endobj stream xref trailer"
        assert _is_low_quality_content(content) is True

    def test_pdf_xmp_metadata_detected(self):
        content = "a" * 300 + " <rdf:rdf> some metadata content here"
        assert _is_low_quality_content(content) is True

    def test_link_heavy_content_is_low_quality(self):
        """Content dominated by markdown links should be flagged."""
        links = " ".join([f"[link{i}](https://example.com/{i})" for i in range(50)])
        # Pad slightly so it meets minimum length
        content = links + " " * 100
        assert _is_low_quality_content(content) is True

    def test_normal_content_with_some_links_passes(self):
        """Content with a few links mixed into prose should pass."""
        prose = "This article discusses the impact of AI on healthcare. " * 15
        links = "[source](https://example.com) and [reference](https://example.com/ref)"
        content = prose + " " + links
        assert _is_low_quality_content(content) is False

    def test_low_alpha_ratio_is_low_quality(self):
        """Content that is mostly non-alphabetic characters should be flagged."""
        content = "12345 67890 !@#$% ^&*() " * 50
        assert _is_low_quality_content(content) is True

    def test_normal_prose_passes(self):
        """Regular article prose should pass all checks."""
        content = (
            "Quantum computing leverages quantum mechanical phenomena such as "
            "superposition and entanglement to perform computations that would be "
            "infeasible for classical computers. Research institutions worldwide "
            "are investing heavily in this technology, with significant breakthroughs "
            "expected in the coming decade. "
        ) * 5
        assert _is_low_quality_content(content) is False

    def test_custom_min_length_threshold(self):
        content = "a" * 150
        assert _is_low_quality_content(content, min_length=200) is True
        assert _is_low_quality_content(content, min_length=100) is False


from agents.search_executor import _canonicalize_url, _compute_authority_score, execute_and_clean_searches
from schemas.schema import SearchQuery
from unittest.mock import patch


class TestSearchEnhancements:
    def test_canonicalize_url_strips_tracking(self):
        url = "https://example.com/article?utm_source=twitter&utm_medium=social&id=123"
        clean = _canonicalize_url(url)
        assert "utm_source" not in clean
        assert "utm_medium" not in clean
        assert "id=123" in clean

    def test_compute_authority_score(self):
        edu_score = _compute_authority_score("https://cs.stanford.edu/research")
        assert edu_score >= 0.8

        gov_score = _compute_authority_score("https://cdc.gov/stats")
        assert gov_score >= 0.8

        standard_score = _compute_authority_score("https://myrandomblog123.com/post")
        assert standard_score == 0.5

    @pytest.mark.anyio
    async def test_search_fallback_triggers_when_primary_fails(self):
        # Mock Tavily client search to fail with Exception
        sq = SearchQuery(id="sq_1_q1", sub_question_id="sq_1", query_string="test query", angle="overview")
        
        with patch("agents.search_executor.tavily_client.search", side_effect=Exception("Unauthorized: missing key")):
            with patch("agents.search_executor._execute_ddg_fallback", return_value=[
                {"url": "https://example.org/valid", "title": "Fallback Result", "content": "Valid prose for machine learning research " * 10, "provider": "duckduckgo", "score": 0.6}
            ]):
                results = await execute_and_clean_searches([sq])
                assert len(results) == 1
                assert results[0].provider == "duckduckgo"
                assert results[0].title == "Fallback Result"
                assert sq.status == "executed"
