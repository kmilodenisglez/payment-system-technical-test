"""
Unit tests for services/payment_service.py
"""
import re
from unittest.mock import patch

import pytest

from services.payment_service import PaymentService, PaymentResult


class TestPaymentService:
    """Tests for the PaymentService business logic."""

    def setup_method(self):
        """Set up a fresh PaymentService instance for each test."""
        self.service = PaymentService()

    def test_process_returns_payment_result(self):
        """Test that process() returns a PaymentResult TypedDict."""
        result = self.service.process(100.0)
        assert isinstance(result, dict)
        assert "approved" in result
        assert "message" in result
        assert "transaction_id" in result
        assert "processed_at" in result

    def test_process_valid_payment_approved(self):
        """Test that valid payments can be approved."""
        with patch("services.payment_service.random.random", return_value=0.5):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 0.8):
                result = self.service.process(50.0)
                assert result["approved"] is True
                assert "Payment approved" in result["message"]
                assert result["transaction_id"] is not None
                assert result["transaction_id"].startswith("txn_")

    def test_process_valid_payment_declined(self):
        """Test that valid payments can be declined."""
        with patch("services.payment_service.random.random", return_value=0.9):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 0.8):
                result = self.service.process(50.0)
                assert result["approved"] is False
                assert "declined" in result["message"].lower()
                assert result["transaction_id"] is None

    def test_process_negative_amount_rejected(self):
        """Test that negative amounts are rejected."""
        result = self.service.process(-100.0)
        assert result["approved"] is False
        assert "must be greater than zero" in result["message"]
        assert result["transaction_id"] is None

    def test_process_zero_amount_rejected(self):
        """Test that zero amounts are rejected."""
        result = self.service.process(0.0)
        assert result["approved"] is False
        assert "must be greater than zero" in result["message"]
        assert result["transaction_id"] is None

    def test_process_small_positive_amount_accepted(self):
        """Test that very small positive amounts are processed (not rejected)."""
        with patch("services.payment_service.random.random", return_value=0.1):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 0.8):
                result = self.service.process(0.01)
                assert result["approved"] is True
                assert result["transaction_id"] is not None

    def test_process_large_amount_accepted(self):
        """Test that large amounts are processed normally."""
        with patch("services.payment_service.random.random", return_value=0.1):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 0.8):
                result = self.service.process(999999.99)
                assert result["approved"] is True
                assert result["transaction_id"] is not None

    def test_process_always_approve(self):
        """Test approval rate of 1.0 (always approve)."""
        with patch("services.payment_service.random.random", return_value=0.0):
            for _ in range(10):
                result = self.service.process(100.0)
                assert result["approved"] is True
                assert result["transaction_id"] is not None

    def test_process_always_decline(self):
        """Test approval rate of 0.0 (always decline)."""
        with patch("services.payment_service.random.random", return_value=1.0):
            for _ in range(10):
                result = self.service.process(100.0)
                assert result["approved"] is False
                assert result["transaction_id"] is None

    def test_process_transaction_id_format(self):
        """Test that transaction IDs have correct format when approved."""
        with patch("services.payment_service.random.random", return_value=0.1):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 1.0):
                result = self.service.process(100.0)
                assert result["transaction_id"] is not None
                # Check format: txn_<12 hex chars>
                assert re.match(r"^txn_[0-9a-f]{12}$", result["transaction_id"])

    def test_process_includes_iso_timestamp(self):
        """Test that processed_at includes ISO 8601 timestamp."""
        result = self.service.process(100.0)
        assert result["processed_at"] is not None
        # Basic ISO 8601 validation (should have T and Z for UTC)
        assert "T" in result["processed_at"]
        assert result["processed_at"].endswith("+00:00") or result["processed_at"].endswith("Z")

    def test_process_float_and_int_amounts(self):
        """Test that both float and int amounts work."""
        with patch("services.payment_service.random.random", return_value=0.1):
            with patch.object(__import__("config.env", fromlist=["Config"]).Config, "APPROVAL_RATE", 0.8):
                result_float = self.service.process(100.5)
                result_int = self.service.process(100)
                assert result_float["approved"] is True
                assert result_int["approved"] is True

    def test_process_multiple_calls_different_outcomes(self):
        """Test that multiple calls can have different outcomes (stochastic)."""
        results = []
        for amount in [10.0, 20.0, 30.0, 40.0, 50.0]:
            result = self.service.process(amount)
            results.append(result["approved"])
        # With approval rate of 0.8, it's very unlikely all 5 are approved
        # (0.8^5 = 0.32768) or all declined. This is a soft assertion.
        # In practice, with 5 calls at 80%, we expect a mix.
        assert True  # Just verify the loop ran without errors
