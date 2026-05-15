import logging
import sys

from config.env import Config


def setup_logger(name: str) -> logging.Logger:
    """
    Creates and returns a named logger that writes structured
    log lines to stdout, honouring the LOG_LEVEL env variable.
    """
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers when the module is imported multiple times
    if logger.handlers:
        return logger

    level = getattr(logging, Config.LOG_LEVEL, logging.INFO)
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    formatter = logging.Formatter(
        fmt="[%(asctime)s] %(levelname)-8s %(name)s — %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
