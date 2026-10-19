import os
import shutil
import tempfile
import pytest
from storage import SQLiteDossierStore
from schemas.schema import ResearchRecord


@pytest.fixture
def temp_store():
    tmp_dir = tempfile.mkdtemp()
    store = SQLiteDossierStore(storage_dir=tmp_dir)
    yield store
    shutil.rmtree(tmp_dir, ignore_errors=True)


@pytest.mark.anyio
async def test_save_and_get_dossier(temp_store):
    record = ResearchRecord(
        id="quantum_cryptography_20261020",
        query="Impact of quantum computing on cryptography",
        report_markdown="# Executive Summary\nQuantum computing threatens RSA...",
        intent="analysis",
        architecture="multi_question",
        scope="moderate",
        entities=["quantum computing", "RSA", "lattice cryptography"],
        sub_questions=["How does Shor's algorithm work?", "What are post-quantum standards?"],
        sources_count=8,
        claims_count=24,
        rounds_executed=2,
        created_at="2026-10-20T00:00:00Z",
        read_time_minutes=4,
    )

    saved_id = await temp_store.save_dossier(record)
    assert saved_id == "quantum_cryptography_20261020"

    retrieved = await temp_store.get_dossier("quantum_cryptography_20261020")
    assert retrieved is not None
    assert retrieved.id == record.id
    assert retrieved.query == record.query
    assert retrieved.report_markdown == record.report_markdown
    assert retrieved.sources_count == 8
    assert len(retrieved.entities) == 3


@pytest.mark.anyio
async def test_list_and_delete_dossiers(temp_store):
    record1 = ResearchRecord(
        id="dossier_1",
        query="Query 1",
        report_markdown="Content 1",
        created_at="2026-10-20T01:00:00Z",
    )
    record2 = ResearchRecord(
        id="dossier_2",
        query="Query 2",
        report_markdown="Content 2",
        created_at="2026-10-20T02:00:00Z",
    )

    await temp_store.save_dossier(record1)
    await temp_store.save_dossier(record2)

    dossiers = await temp_store.list_dossiers()
    assert len(dossiers) == 2
    # Should be sorted descending by created_at
    assert dossiers[0].id == "dossier_2"
    assert dossiers[1].id == "dossier_1"

    deleted = await temp_store.delete_dossier("dossier_1")
    assert deleted is True

    remaining = await temp_store.list_dossiers()
    assert len(remaining) == 1
    assert remaining[0].id == "dossier_2"
