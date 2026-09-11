"""
Unit tests for report_synthesizer helper functions.
"""

from agents.report_synthesizer import _extract_text_content


def test_extract_text_content_string():
    assert _extract_text_content("Hello World") == "Hello World"


def test_extract_text_content_list_of_strings():
    assert _extract_text_content(["Hello ", "World"]) == "Hello World"


def test_extract_text_content_list_of_dicts():
    content = [{"text": "Hello "}, {"text": "World"}]
    assert _extract_text_content(content) == "Hello World"


def test_extract_text_content_mixed():
    class Part:
        def __init__(self, text):
            self.text = text

    content = ["Hello ", {"text": "brave "}, Part("new "), "world"]
    assert _extract_text_content(content) == "Hello brave new world"
