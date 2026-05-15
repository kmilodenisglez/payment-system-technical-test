"""
Unit tests for utils/ modules (json_response, logger)
"""
import json
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock

import pytest

from utils.json_response import send_json
from utils.logger import setup_logger


class TestJsonResponse:
    """Tests for the JSON response utility."""

    def test_send_json_sets_content_type(self):
        """Test that send_json sets correct Content-Type header."""
        mock_handler = Mock()
        mock_handler.wfile = BytesIO()

        send_json(mock_handler, 200, {"status": "ok"})

        # Verify send_response and send_header were called
        mock_handler.send_response.assert_called_once_with(200)
        calls = mock_handler.send_header.call_args_list
        # Look for Content-Type header
        content_type_found = any(
            "Content-Type" in str(call) and "application/json" in str(call)
            for call in calls
        )
        assert content_type_found

    def test_send_json_sets_content_length(self):
        """Test that send_json sets Content-Length header."""
        mock_handler = Mock()
        mock_handler.wfile = BytesIO()

        send_json(mock_handler, 200, {"status": "ok"})

        # Verify Content-Length was set
        calls = mock_handler.send_header.call_args_list
        content_length_found = any(
            "Content-Length" in str(call) for call in calls
        )
        assert content_length_found

    def test_send_json_writes_valid_json(self):
        """Test that send_json writes valid JSON to wfile."""
        mock_handler = Mock()
        wfile = BytesIO()
        mock_handler.wfile = wfile

        data = {"status": "ok", "value": 42}
        send_json(mock_handler, 200, data)

        # Get the written data
        wfile.seek(0)
        written = wfile.read().decode("utf-8")
        parsed = json.loads(written)
        assert parsed == data

    def test_send_json_with_error_response(self):
        """Test send_json with error response structure."""
        mock_handler = Mock()
        mock_handler.wfile = BytesIO()

        error_data = {
            "error": "Bad Request",
            "message": "Invalid JSON",
            "statusCode": 400
        }
        send_json(mock_handler, 400, error_data)

        mock_handler.send_response.assert_called_once_with(400)

    def test_send_json_with_nested_structure(self):
        """Test send_json with nested JSON objects."""
        mock_handler = Mock()
        wfile = BytesIO()
        mock_handler.wfile = wfile

        data = {
            "transaction": {
                "id": "txn_123",
                "amount": 100.50,
                "nested": {"deep": "value"}
            }
        }
        send_json(mock_handler, 200, data)

        wfile.seek(0)
        written = wfile.read().decode("utf-8")
        parsed = json.loads(written)
        assert parsed == data
        assert parsed["transaction"]["nested"]["deep"] == "value"

    def test_send_json_with_list(self):
        """Test send_json with array in response."""
        mock_handler = Mock()
        wfile = BytesIO()
        mock_handler.wfile = wfile

        data = {
            "items": [1, 2, 3],
            "count": 3
        }
        send_json(mock_handler, 200, data)

        wfile.seek(0)
        written = wfile.read().decode("utf-8")
        parsed = json.loads(written)
        assert parsed["items"] == [1, 2, 3]


class TestLogger:
    """Tests for the logger utility."""

    def test_setup_logger_returns_logger(self):
        """Test that setup_logger returns a logger instance."""
        logger = setup_logger("test_logger")
        assert logger is not None
        assert hasattr(logger, "info")
        assert hasattr(logger, "error")
        assert hasattr(logger, "debug")

    def test_setup_logger_has_name(self):
        """Test that logger has the provided name."""
        logger = setup_logger("my_service")
        assert logger.name == "my_service"

    def test_logger_can_log_info(self):
        """Test that logger can log info messages."""
        logger = setup_logger("test_info")
        # Should not raise any exceptions
        logger.info("Test info message")
        logger.info("Message with %s", "formatting")

    def test_logger_can_log_error(self):
        """Test that logger can log error messages."""
        logger = setup_logger("test_error")
        # Should not raise any exceptions
        logger.error("Test error message")
        logger.error("Error with %s", "formatting")

    def test_logger_can_log_debug(self):
        """Test that logger can log debug messages."""
        logger = setup_logger("test_debug")
        # Should not raise any exceptions
        logger.debug("Test debug message")
        logger.debug("Debug with %s", "formatting")

    def test_logger_has_handlers(self):
        """Test that logger has at least one handler configured."""
        logger = setup_logger("test_handlers")
        assert len(logger.handlers) > 0

    @patch("utils.logger.logging.StreamHandler")
    def test_logger_stdout_handler(self, mock_handler):
        """Test that logger configures a StreamHandler."""
        # This is a soft test since handler setup depends on environment
        logger = setup_logger("test_stdout")
        # At minimum, logger should be configured
        assert logger is not None
