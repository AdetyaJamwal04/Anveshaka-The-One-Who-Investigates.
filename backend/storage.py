"""
Dossier & Knowledge Persistence Layer for Anveshaka.
Provides structured storage, indexing, and retrieval of research dossiers.
"""

import os
import json
import sqlite3
import asyncio
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from schemas.schema import ResearchRecord


class BaseDossierStore(ABC):
    @abstractmethod
    async def save_dossier(self, record: ResearchRecord) -> str:
        """Saves a dossier record and returns its unique ID."""
        pass

    @abstractmethod
    async def get_dossier(self, dossier_id: str) -> Optional[ResearchRecord]:
        """Retrieves a dossier by ID."""
        pass

    @abstractmethod
    async def list_dossiers(self, limit: int = 50) -> List[ResearchRecord]:
        """Lists recent dossiers sorted by creation time descending."""
        pass

    @abstractmethod
    async def delete_dossier(self, dossier_id: str) -> bool:
        """Deletes a dossier by ID."""
        pass


class SQLiteDossierStore(BaseDossierStore):
    """
    Production-grade SQLite-backed persistence store.
    Stores full metadata, relational indexes, and writes human-readable markdown files.
    """

    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir is None:
            # Default to reports/ directory at project root
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.dirname(backend_dir)
            storage_dir = os.path.join(root_dir, "reports")
        
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.db_path = os.getenv("DOSSIER_DB_PATH", os.path.join(self.storage_dir, "dossiers.db"))
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS dossiers (
                    id TEXT PRIMARY KEY,
                    query TEXT NOT NULL,
                    report_markdown TEXT NOT NULL,
                    intent TEXT,
                    architecture TEXT,
                    scope TEXT,
                    entities TEXT,
                    sub_questions TEXT,
                    sources_count INTEGER DEFAULT 0,
                    claims_count INTEGER DEFAULT 0,
                    rounds_executed INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    read_time_minutes INTEGER DEFAULT 1
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_dossiers_created_at ON dossiers (created_at DESC)")
            conn.commit()

    async def save_dossier(self, record: ResearchRecord) -> str:
        def _write():
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO dossiers (
                        id, query, report_markdown, intent, architecture, scope,
                        entities, sub_questions, sources_count, claims_count,
                        rounds_executed, created_at, read_time_minutes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.id,
                    record.query,
                    record.report_markdown,
                    record.intent,
                    record.architecture,
                    record.scope,
                    json.dumps(record.entities),
                    json.dumps(record.sub_questions),
                    record.sources_count,
                    record.claims_count,
                    record.rounds_executed,
                    record.created_at,
                    record.read_time_minutes,
                ))
                conn.commit()

            # Also persist markdown to file for direct disk/git inspection
            md_path = os.path.join(self.storage_dir, f"{record.id}.md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(record.report_markdown)

            return record.id

        return await asyncio.to_thread(_write)

    async def get_dossier(self, dossier_id: str) -> Optional[ResearchRecord]:
        def _read():
            # Normalize ID if passed with .md extension
            clean_id = dossier_id.replace(".md", "")
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT * FROM dossiers WHERE id = ?", (clean_id,))
                row = cursor.fetchone()
                if not row:
                    # Fallback: check if markdown file exists on disk
                    md_path = os.path.join(self.storage_dir, f"{clean_id}.md")
                    if os.path.isfile(md_path):
                        with open(md_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        words = len(content.split())
                        stat = os.stat(md_path)
                        return ResearchRecord(
                            id=clean_id,
                            query=clean_id.replace("_", " "),
                            report_markdown=content,
                            created_at=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            read_time_minutes=max(1, words // 200),
                        )
                    return None

                return ResearchRecord(
                    id=row["id"],
                    query=row["query"],
                    report_markdown=row["report_markdown"],
                    intent=row["intent"] or "research",
                    architecture=row["architecture"] or "multi_question",
                    scope=row["scope"] or "moderate",
                    entities=json.loads(row["entities"]) if row["entities"] else [],
                    sub_questions=json.loads(row["sub_questions"]) if row["sub_questions"] else [],
                    sources_count=row["sources_count"],
                    claims_count=row["claims_count"],
                    rounds_executed=row["rounds_executed"],
                    created_at=row["created_at"],
                    read_time_minutes=row["read_time_minutes"],
                )

        return await asyncio.to_thread(_read)

    async def list_dossiers(self, limit: int = 50) -> List[ResearchRecord]:
        def _list():
            records = []
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute(
                    "SELECT * FROM dossiers ORDER BY created_at DESC LIMIT ?", (limit,)
                )
                for row in cursor.fetchall():
                    records.append(
                        ResearchRecord(
                            id=row["id"],
                            query=row["query"],
                            report_markdown=row["report_markdown"],
                            intent=row["intent"] or "research",
                            architecture=row["architecture"] or "multi_question",
                            scope=row["scope"] or "moderate",
                            entities=json.loads(row["entities"]) if row["entities"] else [],
                            sub_questions=json.loads(row["sub_questions"]) if row["sub_questions"] else [],
                            sources_count=row["sources_count"],
                            claims_count=row["claims_count"],
                            rounds_executed=row["rounds_executed"],
                            created_at=row["created_at"],
                            read_time_minutes=row["read_time_minutes"],
                        )
                    )
            return records

        return await asyncio.to_thread(_list)

    async def delete_dossier(self, dossier_id: str) -> bool:
        def _delete():
            clean_id = dossier_id.replace(".md", "")
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("DELETE FROM dossiers WHERE id = ?", (clean_id,))
                conn.commit()
                deleted = cursor.rowcount > 0

            md_path = os.path.join(self.storage_dir, f"{clean_id}.md")
            if os.path.isfile(md_path):
                os.remove(md_path)
                deleted = True

            return deleted

        return await asyncio.to_thread(_delete)


# Global singleton instance
_STORE_INSTANCE: Optional[BaseDossierStore] = None


def get_dossier_store() -> BaseDossierStore:
    global _STORE_INSTANCE
    if _STORE_INSTANCE is None:
        _STORE_INSTANCE = SQLiteDossierStore()
    return _STORE_INSTANCE
