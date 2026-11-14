"""Shared pytest fixtures for COP31 Heatnode backend tests."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from fastapi.testclient import TestClient
import pytest

import backend.db as db_module
import backend.main as main_module
from backend.db import Database


class Clock:
    """Mutable UTC clock for deterministic time-based tests."""

    def __init__(self, initial: datetime | None = None) -> None:
        self.now = initial or datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now

    def advance(self, seconds: int) -> datetime:
        from datetime import timedelta

        self.now = self.now + timedelta(seconds=seconds)
        return self.now


@pytest.fixture()
def clock(monkeypatch: pytest.MonkeyPatch) -> Clock:
    """Provide a controllable UTC clock patched into both db and main modules."""
    c = Clock()
    monkeypatch.setattr(db_module, "utc_now", c)
    monkeypatch.setattr(main_module, "utc_now", c)
    return c


@pytest.fixture()
def test_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Database:
    """Provide an isolated SQLite database per test."""
    db_file = tmp_path / "test_heatnode.db"
    database = Database(db_file)
    database.init_db()
    monkeypatch.setattr(main_module, "db", database)
    return database


@pytest.fixture()
def client(test_db: Database, clock: Clock) -> TestClient:
    """FastAPI TestClient bound to an isolated DB and controllable clock."""
    return TestClient(main_module.app)
