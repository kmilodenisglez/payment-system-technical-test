"""
Utility for sending JSON responses from within BaseHTTPRequestHandler.
Centralising this avoids repeated header-writing boilerplate and
ensures consistent Content-Type / Content-Length headers.
"""
import json
from http.server import BaseHTTPRequestHandler


def send_json(handler: BaseHTTPRequestHandler, status_code: int, data: dict) -> None:
    """Serialise *data* and write it as a JSON HTTP response."""
    body: bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")

    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
