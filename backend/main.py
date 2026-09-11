"""
Anveshaka CLI Runner.
Invokes the compiled LangGraph pipeline.
"""

import sys
import os
import asyncio

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from graph import run_research

DEFAULT_QUERY = (
    "Write a detailed report on diplomatic ties of India and the USA, taking into "
    "consideration the historical angles, and the ongoing exchanges. Also, explore "
    "the angle of how trade affecting the relationship between the two."
)

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_QUERY
    asyncio.run(run_research(query))