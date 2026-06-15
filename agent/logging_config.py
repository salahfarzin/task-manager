"""
Centralised logging configuration.

Produces three log destinations:
  - Console   : INFO and above (keeps terminal readable)
  - agent.log : LOG_LEVEL and above, daily rotation (default INFO)
  - error.log : ERROR and above only, daily rotation (always on)

File naming pattern:
  storage/logs/agent.log            ← today's live log
  storage/logs/agent-YYYY-MM-DD.log ← rotated
  storage/logs/error.log
  storage/logs/error-YYYY-MM-DD.log
"""

import logging
import logging.handlers
import re
from pathlib import Path


def _make_rotating_handler(
    log_dir: Path,
    stem: str,
    level: int,
    fmt: logging.Formatter,
) -> logging.handlers.TimedRotatingFileHandler:
    handler = logging.handlers.TimedRotatingFileHandler(
        filename=str(log_dir / f"{stem}.log"),
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
        delay=False,
    )
    handler.suffix = "%Y-%m-%d"
    # e.g. agent.log.2026-06-15  →  agent-2026-06-15.log
    pattern = re.compile(
        rf"(.*[/\\]{re.escape(stem)})\.log\.(\d{{4}}-\d{{2}}-\d{{2}})$"
    )
    handler.namer = lambda name: pattern.sub(r"\1-\2.log", name)
    handler.setLevel(level)
    handler.setFormatter(fmt)
    return handler


def configure_logging(
    log_dir: Path | str | None = None,
    log_level: str = "INFO",
) -> None:
    """
    Set up file + console logging.

    Safe to call multiple times (e.g. on uvicorn --reload): a second call
    will not add duplicate handlers.

    Args:
        log_dir:   Directory for log files. Relative paths are resolved from
                   the agent package root. Defaults to storage/logs.
        log_level: Standard level name (DEBUG/INFO/WARNING/ERROR).
                   Controls agent.log verbosity. error.log is always ERROR+.
    """
    if log_dir is None:
        log_dir = Path(__file__).parent / "storage" / "logs"
    else:
        log_dir = Path(log_dir)
        if not log_dir.is_absolute():
            log_dir = Path(__file__).parent / log_dir
    log_dir.mkdir(parents=True, exist_ok=True)

    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)-8s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    # Root must be at the lowest level so all handlers can filter independently.
    root.setLevel(min(numeric_level, logging.ERROR))

    existing_files = {
        getattr(h, "baseFilename", None)
        for h in root.handlers
        if isinstance(h, logging.handlers.TimedRotatingFileHandler)
    }

    # --- agent.log : level-based (INFO by default) -----------------------
    agent_log = str(log_dir / "agent.log")
    if agent_log not in existing_files:
        root.addHandler(_make_rotating_handler(log_dir, "agent", numeric_level, fmt))

    # --- error.log : ERROR and above, always -----------------------------
    error_log = str(log_dir / "error.log")
    if error_log not in existing_files:
        root.addHandler(_make_rotating_handler(log_dir, "error", logging.ERROR, fmt))

    # --- Console : INFO and above (never noisier than INFO) --------------
    has_console = any(
        isinstance(h, logging.StreamHandler)
        and not isinstance(h, logging.handlers.TimedRotatingFileHandler)
        for h in root.handlers
    )
    if not has_console:
        console = logging.StreamHandler()
        console.setLevel(logging.INFO)
        console.setFormatter(fmt)
        root.addHandler(console)

    # --- Quieten noisy third-party libraries ----------------------------
    for lib in ("httpx", "httpcore", "urllib3", "openai", "anthropic"):
        logging.getLogger(lib).setLevel(logging.WARNING)
    logging.getLogger("crewai").setLevel(logging.INFO)
