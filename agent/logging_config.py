"""
Centralised logging configuration.

Produces two log destinations:
  - Console  : INFO and above (keeps terminal usable)
  - File     : INFO or DEBUG (controlled by `debug` flag), with daily rotation

File naming pattern:
  storage/logs/agent.log          ← today's live log
  storage/logs/agent-YYYY-MM-DD.log  ← rotated (past days, kept 30 days)
"""

import logging
import logging.handlers
import re
from pathlib import Path


def configure_logging(
    log_dir: Path | str | None = None,
    debug: bool = False,
) -> None:
    """
    Set up file + console logging with daily midnight rotation.

    Safe to call multiple times (e.g. on uvicorn --reload): a second call
    will not add duplicate handlers.
    """
    if log_dir is None:
        log_dir = Path(__file__).parent / "storage" / "logs"
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    root_level = logging.DEBUG if debug else logging.INFO

    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)-8s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(root_level)

    # --- File handler (daily rotation) -----------------------------------
    # Only add once; avoids duplicate entries on uvicorn --reload.
    has_file_handler = any(
        isinstance(h, logging.handlers.TimedRotatingFileHandler)
        for h in root.handlers
    )
    if not has_file_handler:
        file_handler = logging.handlers.TimedRotatingFileHandler(
            filename=str(log_dir / "agent.log"),
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8",
            delay=False,
        )
        file_handler.suffix = "%Y-%m-%d"
        # agent.log.2026-06-15  →  agent-2026-06-15.log
        file_handler.namer = lambda name: re.sub(
            r"(.*[/\\]agent)\.log\.(\d{4}-\d{2}-\d{2})$",
            r"\1-\2.log",
            name,
        )
        file_handler.setLevel(root_level)
        file_handler.setFormatter(fmt)
        root.addHandler(file_handler)

    # --- Console handler -------------------------------------------------
    # Keep the console at INFO even when debug=True (avoid terminal spam).
    has_console_handler = any(
        isinstance(h, logging.StreamHandler)
        and not isinstance(h, logging.handlers.TimedRotatingFileHandler)
        for h in root.handlers
    )
    if not has_console_handler:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(fmt)
        root.addHandler(console_handler)

    # --- Quieten noisy third-party libraries ----------------------------
    for lib in ("httpx", "httpcore", "urllib3", "openai", "anthropic"):
        logging.getLogger(lib).setLevel(logging.WARNING)
    logging.getLogger("crewai").setLevel(logging.INFO)
