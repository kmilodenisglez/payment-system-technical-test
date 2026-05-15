"""
HTTP request handler for the Payment Processor service.

Supported endpoints
-------------------
GET  /health   — liveness probe
POST /process  — simulate a bank payment (JSON body: {"amount": <number>})

All other paths return 404.
All errors return a structured JSON body: {"error": "...", "message": "..."}
"""
import json
from http.server import BaseHTTPRequestHandler

from services.payment_service import PaymentService
from utils.json_response import send_json
from utils.logger import setup_logger

logger = setup_logger("payment_handler")
_payment_service = PaymentService()


class PaymentHandler(BaseHTTPRequestHandler):
    # ------------------------------------------------------------------ #
    # Suppress the default stderr logging so our logger controls output.  #
    # ------------------------------------------------------------------ #
    def log_message(self, fmt: str, *args) -> None:  # type: ignore[override]
        logger.info("%s - %s", self.address_string(), fmt % args)

    # ------------------------------------------------------------------ #
    # Route dispatch                                                       #
    # ------------------------------------------------------------------ #
    def do_GET(self) -> None:
        if self.path == "/health":
            send_json(self, 200, {"status": "ok", "service": "payment-processor"})
        else:
            send_json(self, 404, {"error": "Not Found", "message": f"GET {self.path} not found"})

    def do_POST(self) -> None:
        if self.path == "/process":
            self._handle_process()
        else:
            send_json(self, 404, {"error": "Not Found", "message": f"POST {self.path} not found"})

    # ------------------------------------------------------------------ #
    # Handler: POST /process                                               #
    # ------------------------------------------------------------------ #
    def _handle_process(self) -> None:
        try:
            body = self._read_json_body()
            if body is None:
                return  # response already sent by _read_json_body

            amount = body.get("amount")

            if amount is None:
                send_json(self, 400, {
                    "error": "Bad Request",
                    "message": "'amount' field is required",
                })
                return

            if not isinstance(amount, (int, float)) or isinstance(amount, bool):
                send_json(self, 400, {
                    "error": "Bad Request",
                    "message": "'amount' must be a numeric value",
                })
                return

            result = _payment_service.process(float(amount))

            logger.info(
                "Processed payment | amount=%.2f approved=%s transaction_id=%s",
                amount,
                result["approved"],
                result["transaction_id"],
            )
            send_json(self, 200, result)

        except Exception:
            logger.exception("Unexpected error in _handle_process")
            send_json(self, 500, {
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
            })

    # ------------------------------------------------------------------ #
    # Helper: read and parse the JSON request body                        #
    # ------------------------------------------------------------------ #
    def _read_json_body(self) -> dict | None:
        content_length_str = self.headers.get("Content-Length")

        if not content_length_str:
            send_json(self, 400, {
                "error": "Bad Request",
                "message": "Content-Length header is required",
            })
            return None

        try:
            content_length = int(content_length_str)
        except ValueError:
            send_json(self, 400, {
                "error": "Bad Request",
                "message": "Content-Length must be an integer",
            })
            return None

        if content_length == 0:
            send_json(self, 400, {
                "error": "Bad Request",
                "message": "Request body must not be empty",
            })
            return None

        raw = self.rfile.read(content_length)
        try:
            return json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            send_json(self, 400, {
                "error": "Bad Request",
                "message": "Invalid JSON body",
            })
            return None
