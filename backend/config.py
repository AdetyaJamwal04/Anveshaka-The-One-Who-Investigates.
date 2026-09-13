"""
Application configuration - loads API keys and model settings from environment.
"""

import os
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

# API CREDENTIALS
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# LLM MODEL: Defaults to gemini-3.5-flash-lite for ultra-fast pipeline throughput
model_name = os.getenv("MODEL_NAME", "gemini-3.5-flash-lite")
