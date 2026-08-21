"""
Utility helper functions for DeepSearch Agentic System.
"""

import re
from typing import List, Optional

STOP_WORDS = {
    "what", "is", "are", "the", "a", "an", "how", "does", "do", "in", "of", 
    "and", "for", "to", "on", "with", "by", "tell", "me", "about", "which",
    "one", "between", "versus", "vs", "compare", "analyze", "explain", "describe"
}


def slugify_topic(query: str, entities: Optional[List[str]] = None, max_words: int = 5) -> str:
    """
    Creates a clean, human-readable topic slug for report filenames.
    
    Examples:
      - entities=['Raw Pressery', 'Yu!'] -> 'raw_pressery_yu'
      - query='Impact of mephentermine on digestion' -> 'mephentermine_digestion'
    """
    if entities and len(entities) > 0:
        base_text = " ".join(entities[:3])
    else:
        base_text = query

    # Remove non-alphanumeric chars (keep spaces)
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", base_text).strip()
    words = [w.lower() for w in cleaned.split() if w]

    # If derived from raw query and not explicit entities, filter common stop words
    if not entities:
        filtered_words = [w for w in words if w not in STOP_WORDS]
        if filtered_words:
            words = filtered_words

    slug = "_".join(words[:max_words])[:50].rstrip("_")
    return slug if slug else "research_report"
