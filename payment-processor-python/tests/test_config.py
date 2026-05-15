"""
Unit tests for config/env.py
"""
import os

import pytest

# Import after path is set up by conftest
from config.env import Config


class TestConfigEnv:
    """Tests for environment configuration loading."""

    def test_default_host(self, monkeypatch):
        """Test that default HOST is 0.0.0.0 when env var is not set."""
        monkeypatch.delenv("PAYMENT_PROCESSOR_HOST", raising=False)
        # Force reimport to get fresh Config values
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.HOST == "0.0.0.0"

    def test_custom_host(self, monkeypatch):
        """Test that custom HOST is read from environment."""
        monkeypatch.setenv("PAYMENT_PROCESSOR_HOST", "127.0.0.1")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.HOST == "127.0.0.1"

    def test_default_port(self, monkeypatch):
        """Test that default PORT is 5000 when env var is not set."""
        monkeypatch.delenv("PAYMENT_PROCESSOR_PORT", raising=False)
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.PORT == 5000

    def test_custom_port(self, monkeypatch):
        """Test that custom PORT is read from environment."""
        monkeypatch.setenv("PAYMENT_PROCESSOR_PORT", "8080")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.PORT == 8080

    def test_invalid_port_raises_error(self, monkeypatch):
        """Test that invalid PORT raises ValueError."""
        monkeypatch.setenv("PAYMENT_PROCESSOR_PORT", "not_a_number")
        with pytest.raises(ValueError):
            import importlib
            import config.env
            importlib.reload(config.env)

    def test_default_log_level(self, monkeypatch):
        """Test that default LOG_LEVEL is INFO."""
        monkeypatch.delenv("LOG_LEVEL", raising=False)
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.LOG_LEVEL == "INFO"

    def test_custom_log_level(self, monkeypatch):
        """Test that custom LOG_LEVEL is read from environment."""
        monkeypatch.setenv("LOG_LEVEL", "debug")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.LOG_LEVEL == "DEBUG"

    def test_default_approval_rate(self, monkeypatch):
        """Test that default APPROVAL_RATE is 0.8."""
        monkeypatch.delenv("APPROVAL_RATE", raising=False)
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.APPROVAL_RATE == 0.8

    def test_custom_approval_rate(self, monkeypatch):
        """Test that custom APPROVAL_RATE is read from environment."""
        monkeypatch.setenv("APPROVAL_RATE", "0.5")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.APPROVAL_RATE == 0.5

    def test_approval_rate_boundary_zero(self, monkeypatch):
        """Test that APPROVAL_RATE can be set to 0 (always decline)."""
        monkeypatch.setenv("APPROVAL_RATE", "0.0")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.APPROVAL_RATE == 0.0

    def test_approval_rate_boundary_one(self, monkeypatch):
        """Test that APPROVAL_RATE can be set to 1 (always approve)."""
        monkeypatch.setenv("APPROVAL_RATE", "1.0")
        import importlib
        import config.env
        importlib.reload(config.env)
        assert config.env.Config.APPROVAL_RATE == 1.0

    def test_invalid_approval_rate_raises_error(self, monkeypatch):
        """Test that invalid APPROVAL_RATE raises ValueError."""
        monkeypatch.setenv("APPROVAL_RATE", "not_a_float")
        with pytest.raises(ValueError):
            import importlib
            import config.env
            importlib.reload(config.env)
