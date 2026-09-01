"""
Application configuration — loads API keys and model settings from environment.
"""

from dotenv import load_dotenv
import os

# Load .env from project root or backend directory
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
local_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

if os.path.exists(root_env):
    load_dotenv(root_env)
elif os.path.exists(local_env):
    load_dotenv(local_env)
else:
    load_dotenv()

# API CREDENTIALS
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# LLM MODEL (configurable via .env, defaults to flash-lite)
model_name = os.getenv("MODEL_NAME", "gemini-2.5-flash-lite")
