"""
Centralised logging configuration.

Produces two log destinations:
  - Console          : INFO and above (keeps terminal readable)
  - app-YYYY-MM-DD.log : LOG_LEVEL and above, daily rotation, 30-day retention

Rotation happens at midnight: the handler closes the old file and opens a new one
named with the new date. Files older than 30 days are deleted automatically.
"""

import logging
import logging.handlers
from datetime import date, timedelta
from pathlib import Path


class DailyFileHandler(logging.FileHandler):
    """FileHandler that writes to <stem>-YYYY-MM-DD.log and rotates at midnight."""

    def __init__(
        self,
        log_dir: Path,
        stem: str,
        level: int,
        fmt: logging.Formatter,
        backup_days: int = 30,
    ) -> None:
        self._log_dir = log_dir
        self._stem = stem
        self._backup_days = backup_days
        self._current_date = date.today()
        super().__init__(
            filename=self._path_for(self._current_date),
            mode="a",
            encoding="utf-8",
            delay=False,
        )
        self.setLevel(level)
        self.setFormatter(fmt)

    def _path_for(self, d: date) -> str:
        return str(self._log_dir / f"{self._stem}-{d:%Y-%m-%d}.log")

    def _rotate(self) -> None:
        """Close current file, open today's, prune old files."""
        if self.stream:
            self.stream.flush()
            self.stream.close()
            self.stream = None  # type: ignore[assignment]
        self._current_date = date.today()
        self.baseFilename = self._path_for(self._current_date)
        self.stream = self._open()
        self._prune()

    def _prune(self) -> None:
        cutoff = date.today() - timedelta(days=self._backup_days)
        for f in self._log_dir.glob(f"{self._stem}-*.log"):
            try:
                file_date = date.fromisoformat(f.stem[len(self._stem) + 1:])
                if file_date < cutoff:
                    f.unlink(missing_ok=True)
            except ValueError:
                pass

    def emit(self, record: logging.LogRecord) -> None:
        if date.today() != self._current_date:
            self._rotate()
        super().emit(record)


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
                   Controls app-*.log verbosity.
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
    root.setLevel(numeric_level)

    existing_stems = {
        getattr(h, "_stem", None)
        for h in root.handlers
        if isinstance(h, DailyFileHandler)
    }

    # --- app-YYYY-MM-DD.log : single file for everything at LOG_LEVEL+ ---
    if "app" not in existing_stems:
        root.addHandler(DailyFileHandler(log_dir, "app", numeric_level, fmt))

    # --- Console : INFO and above (never noisier than INFO) --------------
    has_console = any(
        isinstance(h, logging.StreamHandler)
        and not isinstance(h, DailyFileHandler)
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
