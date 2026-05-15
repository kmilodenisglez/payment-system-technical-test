"""
Core payment-processing logic.

This service simulates a bank gateway:
  - Rejects payments with an amount ≤ 0 outright.
  - Approves or declines valid payments with the configured probability
    (default 80 % approved / 20 % declined).

No external libraries are used — only the Python standard library.
"""
import random
import uuid
from datetime import datetime, timezone
from typing import TypedDict, Optional

from config.env import Config


class PaymentResult(TypedDict):
    approved: bool
    message: str
    transaction_id: Optional[str]
    processed_at: str


class PaymentService:
    def process(self, amount: float) -> PaymentResult:
        """
        Simulate payment processing.

        Parameters
        ----------
        amount:
            The monetary value of the transaction (must be > 0).

        Returns
        -------
        PaymentResult:
            A dict containing the approval decision, a bank message,
            an optional transaction ID, and a UTC timestamp.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        if amount <= 0:
            return PaymentResult(
                approved=False,
                message="Invalid amount: must be greater than zero",
                transaction_id=None,
                processed_at=now_iso,
            )

        approved: bool = random.random() < Config.APPROVAL_RATE

        return PaymentResult(
            approved=approved,
            message="Payment approved" if approved else "Payment declined: insufficient funds",
            transaction_id=f"txn_{uuid.uuid4().hex[:12]}" if approved else None,
            processed_at=now_iso,
        )
