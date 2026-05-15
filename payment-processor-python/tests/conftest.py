"""
Pytest configuration and shared fixtures for Payment Processor tests.
"""
import sys
from pathlib import Path

import pytest


# ────────────────────────────────────────────────────────────────────────────────
# Path Setup — ensure src/ is importable during tests
# ────────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


# ────────────────────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_env_clear(monkeypatch):
    """Fixture to clear and control environment variables during tests."""
    monkeypatch.setenv("PAYMENT_PROCESSOR_HOST", "0.0.0.0")
    monkeypatch.setenv("PAYMENT_PROCESSOR_PORT", "5000")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("APPROVAL_RATE", "0.8")
    return monkeypatch
