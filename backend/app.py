"""
Anveshaka Streamlit Frontend
Interactive UI for the Anveshaka agentic research pipeline.
"""

import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
from datetime import datetime

import streamlit as st
from utils import slugify_topic

sys.stdout.reconfigure(encoding="utf-8")

# ── Page Config ──────────────────────────────────────────────────
st.set_page_config(
    page_title="Anveshaka — Agentic Research",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ───────────────────────────────────────────────────
st.markdown("""
<style>
    /* Global */
    .stApp {
        background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
    }
    
    /* Main header */
    .main-header {
        text-align: center;
        padding: 2rem 0 1rem;
    }
    .main-header h1 {
        background: linear-gradient(135deg, #58a6ff, #bc8cff, #f778ba);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: 0.3rem;
    }
    .main-header p {
        color: #8b949e;
        font-size: 1.1rem;
    }
    
    /* Stage cards */
    .stage-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 1rem 1.2rem;
        margin-bottom: 0.6rem;
        transition: all 0.3s ease;
    }
    .stage-card.active {
        border-color: #58a6ff;
        box-shadow: 0 0 15px rgba(88, 166, 255, 0.15);
    }
    .stage-card.done {
        border-color: #3fb950;
        background: rgba(63, 185, 80, 0.05);
    }
    
    /* Status badges */
    .badge {
        display: inline-block;
        padding: 0.15rem 0.6rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-waiting { background: #30363d; color: #8b949e; }
    .badge-running { background: rgba(88, 166, 255, 0.15); color: #58a6ff; }
    .badge-done { background: rgba(63, 185, 80, 0.12); color: #3fb950; }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background: #0d1117;
        border-right: 1px solid #30363d;
    }
    
    /* Example query buttons */
    .example-btn {
        background: rgba(88, 166, 255, 0.08);
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 0.6rem 1rem;
        color: #c9d1d9;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-align: left;
        margin-bottom: 0.4rem;
    }
    .example-btn:hover {
        border-color: #58a6ff;
        background: rgba(88, 166, 255, 0.15);
    }
    
    /* Report container */
    .report-container {
        background: rgba(22, 27, 34, 0.6);
        border: 1px solid #30363d;
        border-radius: 16px;
        padding: 2rem;
        margin-top: 1rem;
    }
    
    /* Stats cards */
    .stat-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
    }
    .stat-card h3 {
        color: #58a6ff;
        font-size: 1.8rem;
        margin: 0;
    }
    .stat-card p {
        color: #8b949e;
        font-size: 0.85rem;
        margin: 0;
    }
</style>
""", unsafe_allow_html=True)


# ── Pipeline Stages ──────────────────────────────────────────────
STAGES = [
    ("🔬", "Query Synthesis", "Analyzing intent, scope, and entities"),
    ("🧩", "Decomposition", "Breaking into sub-questions"),
    ("🔎", "Query Generation", "Creating diverse search queries"),
    ("🌐", "Web Search", "Searching via Tavily API"),
    ("📋", "Evidence Extraction", "Extracting factual claims"),
    ("🪞", "Reflection", "Evaluating coverage gaps"),
    ("📝", "Report Synthesis", "Generating cited report"),
]


def render_stage_tracker(current_stage: int, total_rounds: int = 1):
    """Render the visual pipeline progress tracker."""
    for i, (icon, name, desc) in enumerate(STAGES):
        if i < current_stage:
            status_class = "done"
            badge = '<span class="badge badge-done">✓ Done</span>'
        elif i == current_stage:
            status_class = "active"
            badge = '<span class="badge badge-running">● Running</span>'
        else:
            status_class = ""
            badge = '<span class="badge badge-waiting">Waiting</span>'

        round_info = f" (Round {total_rounds})" if i >= 2 and i <= 5 and total_rounds > 1 else ""

        st.markdown(f"""
        <div class="stage-card {status_class}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 1.2rem;">{icon}</span>
                    <strong style="color: #c9d1d9; margin-left: 0.5rem;">{name}{round_info}</strong>
                    <span style="color: #8b949e; font-size: 0.85rem; margin-left: 0.8rem;">{desc}</span>
                </div>
                {badge}
            </div>
        </div>
        """, unsafe_allow_html=True)


async def run_pipeline(query: str, stage_placeholder, stats_placeholder, report_placeholder):
    """Execute the full Anveshaka pipeline with live UI updates."""
    from agents.query_synthesizer import synthesize_query
    from agents.subquestion_generator import generate_sub_questions
    from agents.search_query_generator import generate_search_queries
    from agents.search_executor import execute_and_clean_searches
    from agents.content_processor import extract_evidence
    from agents.knowledge_store import KnowledgeStore
    from agents.reflection import reflect
    from agents.report_synthesizer import synthesize_report

    MAX_ROUNDS = 3
    current_round = 1

    # ── Stage 1: Query Synthesis ─────────────────────────────────
    with stage_placeholder.container():
        render_stage_tracker(0)
    
    synthesis = await synthesize_query(query)
    if synthesis is None:
        st.error("❌ Query synthesis failed. Please try again.")
        return None

    # ── Stage 2: Decomposition ───────────────────────────────────
    with stage_placeholder.container():
        render_stage_tracker(1)
    
    sub_questions = await generate_sub_questions(synthesis)
    store = KnowledgeStore(sub_questions)

    active_sub_questions = list(sub_questions)
    suggested_angles = None

    for round_num in range(1, MAX_ROUNDS + 1):
        current_round = round_num

        # ── Stage 3: Search Query Generation ─────────────────────
        with stage_placeholder.container():
            render_stage_tracker(2, current_round)
        
        search_queries = await generate_search_queries(
            active_sub_questions,
            round_num=round_num,
            suggested_angles=suggested_angles,
            exclude_queries=store.previously_searched_strings() if round_num > 1 else None,
        )
        store.add_queries(search_queries)

        # ── Stage 4: Web Search ──────────────────────────────────
        with stage_placeholder.container():
            render_stage_tracker(3, current_round)
        
        search_results = await execute_and_clean_searches(search_queries)

        # ── Stage 5: Evidence Extraction ─────────────────────────
        with stage_placeholder.container():
            render_stage_tracker(4, current_round)
        
        new_evidence = await extract_evidence(active_sub_questions, search_results)
        store.add_evidence(new_evidence)

        # Update live stats
        with stats_placeholder.container():
            c1, c2, c3, c4 = st.columns(4)
            with c1:
                st.markdown(f'<div class="stat-card"><h3>{len(sub_questions)}</h3><p>Sub-questions</p></div>', unsafe_allow_html=True)
            with c2:
                st.markdown(f'<div class="stat-card"><h3>{len(store.search_queries)}</h3><p>Queries Searched</p></div>', unsafe_allow_html=True)
            with c3:
                st.markdown(f'<div class="stat-card"><h3>{len(store.evidence)}</h3><p>Evidence Claims</p></div>', unsafe_allow_html=True)
            with c4:
                st.markdown(f'<div class="stat-card"><h3>{current_round}/{MAX_ROUNDS}</h3><p>Round</p></div>', unsafe_allow_html=True)

        # ── Stage 6: Reflection ──────────────────────────────────
        with stage_placeholder.container():
            render_stage_tracker(5, current_round)

        if round_num == MAX_ROUNDS:
            break

        verdicts = await reflect(store)
        needs_more = [v for v in verdicts if v.verdict == "needs_more"]

        if not needs_more:
            break

        needs_more_ids = {v.sub_question_id for v in needs_more}
        active_sub_questions = [sq for sq in sub_questions if sq.id in needs_more_ids]
        suggested_angles = {
            v.sub_question_id: v.suggested_angles
            for v in needs_more if v.suggested_angles
        }

    # ── Stage 7: Report Synthesis ────────────────────────────────
    with stage_placeholder.container():
        render_stage_tracker(6, current_round)
    
    report = await synthesize_report(query, store)

    # Show completed state
    with stage_placeholder.container():
        render_stage_tracker(7, current_round)

    # Final stats
    unique_sources = len({e.source_url for e in store.evidence})
    with stats_placeholder.container():
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.markdown(f'<div class="stat-card"><h3>{len(sub_questions)}</h3><p>Sub-questions</p></div>', unsafe_allow_html=True)
        with c2:
            st.markdown(f'<div class="stat-card"><h3>{len(store.search_queries)}</h3><p>Queries Searched</p></div>', unsafe_allow_html=True)
        with c3:
            st.markdown(f'<div class="stat-card"><h3>{len(store.evidence)}</h3><p>Evidence Claims</p></div>', unsafe_allow_html=True)
        with c4:
            st.markdown(f'<div class="stat-card"><h3>{unique_sources}</h3><p>Unique Sources</p></div>', unsafe_allow_html=True)

    # Save report
    reports_dir = os.path.join(os.path.dirname(backend_dir), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    topic_slug = slugify_topic(query, synthesis.entities if synthesis else [])
    filename = os.path.join(reports_dir, f"{topic_slug}_{timestamp}.md")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)

    return report


# ── Sidebar ──────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🔍 Anveshaka")
    st.markdown("---")
    
    st.markdown("### 💡 Example Queries")
    st.caption("Click to try one of these research topics:")

    examples = [
        "Impact of quantum computing on modern cryptography",
        "How does intermittent fasting affect metabolic health?",
        "Compare transformer vs. state-space models for NLP",
        "History and future of nuclear fusion energy",
        "Effects of social media on adolescent mental health",
    ]

    for ex in examples:
        if st.button(ex, key=f"ex_{hash(ex)}", use_container_width=True):
            st.session_state["query_input"] = ex

    st.markdown("---")
    st.markdown("### ⚙️ About")
    st.markdown("""
    **Pipeline:** LangGraph  
    **LLM:** Google Gemini  
    **Search:** Tavily API  
    **Max Rounds:** 3  
    """)
    st.markdown("---")
    st.caption("Built by [AdetyaJamwal04](https://github.com/AdetyaJamwal04)")


# ── Main Content ─────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <h1>🔍 Anveshaka</h1>
    <p>अन्वेषक — Autonomous research agent that investigates, analyzes, and reports.</p>
</div>
""", unsafe_allow_html=True)

# Query input
query = st.text_area(
    "What would you like to research?",
    value=st.session_state.get("query_input", ""),
    height=100,
    placeholder="Enter your research question here... (e.g., 'What are the latest advances in CRISPR gene editing?')",
    key="query_area",
)

col1, col2 = st.columns([1, 5])
with col1:
    run_clicked = st.button("🚀 Research", type="primary", use_container_width=True)
with col2:
    st.caption("Typically takes 1–3 minutes depending on query complexity.")

# ── Run Pipeline ─────────────────────────────────────────────────
if run_clicked and query.strip():
    st.markdown("---")
    
    # Placeholders for live updates
    stats_placeholder = st.empty()
    stage_placeholder = st.empty()
    report_placeholder = st.empty()

    with st.spinner(""):
        report = asyncio.run(run_pipeline(
            query.strip(),
            stage_placeholder,
            stats_placeholder,
            report_placeholder,
        ))

    if report:
        st.markdown("---")
        st.markdown("## 📄 Research Report")
        st.markdown(report, unsafe_allow_html=False)
        
        topic_slug = slugify_topic(query.strip())
        st.download_button(
            label="📥 Download Report (Markdown)",
            data=report,
            file_name=f"{topic_slug}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
            mime="text/markdown",
        )

elif run_clicked:
    st.warning("Please enter a research question.")
