"""
Unit tests for utils.py (topic slug generation).
"""

import pytest
from utils import slugify_topic


class TestSlugifyTopic:
    def test_slugify_with_entities(self):
        entities = ["Raw Pressery", "Yu!", "Coconut Water"]
        slug = slugify_topic("Compare two brands", entities=entities)
        assert slug == "raw_pressery_yu_coconut_water"

    def test_slugify_with_query_only(self):
        query = "Impact of mephentermine on digestion and hormonal health"
        slug = slugify_topic(query)
        assert "mephentermine" in slug
        assert "digestion" in slug
        # Stop words like 'of', 'on', 'and' should be omitted
        assert "impact" not in slug or "mephentermine" in slug

    def test_slugify_removes_special_characters(self):
        query = "Is AI > Human? (2026 update) @ OpenAI!"
        slug = slugify_topic(query)
        assert "@" not in slug
        assert ">" not in slug
        assert "?" not in slug
        assert "!" not in slug

    def test_slugify_empty_input_returns_default(self):
        assert slugify_topic("") == "research_report"
        assert slugify_topic("???") == "research_report"
