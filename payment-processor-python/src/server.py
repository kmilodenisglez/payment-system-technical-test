"""
Entry point for the Payment Processor microservice.

Uses Python's standard-library `socketserver.ThreadingTCPServer` so that
concurrent requests (e.g. from multiple classroom students) are handled
in separate threads without blocking one another.

No third-party dependencies — stdlib only.
"""
import os
import sys

# Ensure the src/ directory is on the Python path so that sibling packages
# (config, handlers, services, utils) are importable when running directly.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import socketserver

from config.env import Config
from handlers.payment_handler import PaymentHandler
from utils.logger import setup_logger

logger = setup_logger("server")


def main() -> None:
    # allow_reuse_address prevents "Address already in use" on quick restarts
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.ThreadingTCPServer((Config.HOST, Config.PORT), PaymentHandler) as httpd:
        logger.info(
            "Payment Processor running on http://%s:%d",
            Config.HOST,
            Config.PORT,
        )
        logger.info("Approval rate: %.0f%%", Config.APPROVAL_RATE * 100)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received — shutting down gracefully")
        finally:
            httpd.server_close()
            logger.info("Server stopped")


if __name__ == "__main__":
    main()
