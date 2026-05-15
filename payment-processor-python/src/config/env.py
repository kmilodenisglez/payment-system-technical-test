"""
Environment configuration for the Payment Processor service.
All values are read from environment variables with safe defaults.
"""
import os


class Config:
    HOST: str = os.getenv("PAYMENT_PROCESSOR_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PAYMENT_PROCESSOR_PORT", "5000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    # Probability of an approved payment (0.0 – 1.0)
    APPROVAL_RATE: float = float(os.getenv("APPROVAL_RATE", "0.8"))
