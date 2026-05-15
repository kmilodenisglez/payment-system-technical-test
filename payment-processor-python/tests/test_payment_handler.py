"""
Unit tests for handlers/payment_handler.py
"""
import json
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock

import pytest

from handlers.payment_handler import PaymentHandler


class MockRequest:
    """Mock HTTP request for testing PaymentHandler."""

    def __init__(self, method, path, body=None, headers=None):
        self.method = method
        self.path = path
        self.body = body
        self.headers = headers or {}
        if body is not None:
            self.headers["Content-Length"] = str(len(body))


class TestPaymentHandler:
    """Tests for the PaymentHandler HTTP request handler."""

    def create_mock_handler(self, method, path, body=None):
        """Helper to create a mock PaymentHandler instance."""
        mock_handler = MagicMock(spec=PaymentHandler)
        mock_handler.path = path
        mock_handler.command = method
        mock_handler.headers = {}

        # Set up rfile for reading request body
        if body is not None:
            mock_handler.rfile = BytesIO(body)
            mock_handler.headers["Content-Length"] = str(len(body))
        else:
            mock_handler.rfile = BytesIO(b"")

        # Set up wfile for writing response
        mock_handler.wfile = BytesIO()

        # Mock address_string
        mock_handler.address_string.return_value = "127.0.0.1"

        return mock_handler

    def test_get_health_endpoint_success(self):
        """Test that GET /health returns 200 OK."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            with patch.object(PaymentHandler, "do_GET") as mock_do_get:
                handler = Mock(spec=PaymentHandler)
                handler.path = "/health"
                handler.command = "GET"

                # Manually call the handler logic since we're mocking
                from handlers.payment_handler import PaymentHandler as OrigHandler
                original_get = OrigHandler.do_GET

                handler.do_GET = lambda: original_get(handler)

                # Should be called without error
                handler.do_GET()

    def test_get_not_found_returns_404(self):
        """Test that GET /unknown returns 404."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            handler.path = "/unknown"
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            original_get = OrigHandler.do_GET

            handler.do_GET = lambda: original_get(handler)
            handler.do_GET()

            # Verify 404 was sent
            calls = mock_send.call_args_list
            assert any("404" in str(call) for call in calls)

    def test_post_process_with_valid_json(self):
        """Test POST /process with valid JSON body."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            with patch("handlers.payment_handler._payment_service.process") as mock_process:
                mock_process.return_value = {
                    "approved": True,
                    "message": "Payment approved",
                    "transaction_id": "txn_123",
                    "processed_at": "2026-05-15T00:00:00Z"
                }

                handler = Mock(spec=PaymentHandler)
                handler.path = "/process"
                handler.command = "POST"
                body = b'{"amount": 100.0}'
                handler.rfile = BytesIO(body)
                handler.headers = {"Content-Length": str(len(body))}
                handler.address_string.return_value = "127.0.0.1"

                from handlers.payment_handler import PaymentHandler as OrigHandler
                original_post = OrigHandler.do_POST

                handler.do_POST = lambda: original_post(handler)
                handler.do_POST()

    def test_post_process_missing_content_length(self):
        """Test POST /process without Content-Length header."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            handler.path = "/process"
            handler.command = "POST"
            handler.rfile = BytesIO(b'{"amount": 100}')
            handler.headers = {}  # No Content-Length
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            # Directly test _read_json_body method
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is None
            # Verify 400 was sent for missing Content-Length
            calls = mock_send.call_args_list
            assert any("400" in str(call) for call in calls)

    def test_post_process_invalid_content_length(self):
        """Test POST /process with invalid Content-Length."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            handler.path = "/process"
            handler.rfile = BytesIO(b'{"amount": 100}')
            handler.headers = {"Content-Length": "not_a_number"}
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is None
            calls = mock_send.call_args_list
            assert any("400" in str(call) for call in calls)

    def test_post_process_empty_body(self):
        """Test POST /process with empty body (Content-Length: 0)."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            handler.rfile = BytesIO(b'')
            handler.headers = {"Content-Length": "0"}
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is None
            calls = mock_send.call_args_list
            assert any("400" in str(call) for call in calls)

    def test_post_process_invalid_json(self):
        """Test POST /process with invalid JSON."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            body = b'not valid json {'
            handler.rfile = BytesIO(body)
            handler.headers = {"Content-Length": str(len(body))}
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is None
            calls = mock_send.call_args_list
            assert any("400" in str(call) for call in calls)

    def test_post_process_missing_amount_field(self):
        """Test POST /process without 'amount' field."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            with patch("handlers.payment_handler._payment_service"):
                handler = Mock(spec=PaymentHandler)
                handler.path = "/process"
                body = b'{"value": 100}'  # Wrong field name
                handler.rfile = BytesIO(body)
                handler.headers = {"Content-Length": str(len(body))}
                handler.address_string.return_value = "127.0.0.1"

                from handlers.payment_handler import PaymentHandler as OrigHandler
                handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
                handler._handle_process = OrigHandler._handle_process.__get__(handler, PaymentHandler)

                handler._handle_process()

                # Verify 400 was sent for missing 'amount'
                calls = mock_send.call_args_list
                assert any("400" in str(call) for call in calls)

    def test_post_process_amount_not_numeric(self):
        """Test POST /process with non-numeric amount."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            with patch("handlers.payment_handler._payment_service"):
                handler = Mock(spec=PaymentHandler)
                handler.path = "/process"
                body = b'{"amount": "hundred"}'
                handler.rfile = BytesIO(body)
                handler.headers = {"Content-Length": str(len(body))}
                handler.address_string.return_value = "127.0.0.1"

                from handlers.payment_handler import PaymentHandler as OrigHandler
                handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
                handler._handle_process = OrigHandler._handle_process.__get__(handler, PaymentHandler)

                handler._handle_process()

                calls = mock_send.call_args_list
                assert any("400" in str(call) for call in calls)

    def test_post_process_amount_boolean_rejected(self):
        """Test that amount cannot be a boolean (even though bool is subclass of int)."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            with patch("handlers.payment_handler._payment_service"):
                handler = Mock(spec=PaymentHandler)
                handler.path = "/process"
                body = b'{"amount": true}'
                handler.rfile = BytesIO(body)
                handler.headers = {"Content-Length": str(len(body))}
                handler.address_string.return_value = "127.0.0.1"

                from handlers.payment_handler import PaymentHandler as OrigHandler
                handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
                handler._handle_process = OrigHandler._handle_process.__get__(handler, PaymentHandler)

                handler._handle_process()

                calls = mock_send.call_args_list
                assert any("400" in str(call) for call in calls)

    def test_post_not_found_returns_404(self):
        """Test that POST /unknown returns 404."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            handler.path = "/unknown"
            handler.command = "POST"
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            original_post = OrigHandler.do_POST

            handler.do_POST = lambda: original_post(handler)
            handler.do_POST()

            calls = mock_send.call_args_list
            assert any("404" in str(call) for call in calls)

    def test_utf8_json_parsing(self):
        """Test that UTF-8 JSON is parsed correctly."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            # UTF-8 encoded JSON
            body = '{"amount": 50.5, "user": "José"}'.encode("utf-8")
            handler.rfile = BytesIO(body)
            handler.headers = {"Content-Length": str(len(body))}
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is not None
            assert result["amount"] == 50.5
            assert result["user"] == "José"

    def test_utf8_decoding_error(self):
        """Test handling of invalid UTF-8 bytes."""
        with patch("handlers.payment_handler.send_json") as mock_send:
            handler = Mock(spec=PaymentHandler)
            # Invalid UTF-8 sequence
            body = b'{"amount": \xff\xfe}'
            handler.rfile = BytesIO(body)
            handler.headers = {"Content-Length": str(len(body))}
            handler.address_string.return_value = "127.0.0.1"

            from handlers.payment_handler import PaymentHandler as OrigHandler
            handler._read_json_body = OrigHandler._read_json_body.__get__(handler, PaymentHandler)
            result = handler._read_json_body()

            assert result is None
            calls = mock_send.call_args_list
            assert any("400" in str(call) for call in calls)
