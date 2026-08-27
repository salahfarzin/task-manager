"""Lightweight in-memory progress tracker for the agent pipeline.

Each tool writes a human-readable step message keyed by task_id.
The status endpoint reads it and forwards it to the frontend so users
can see what the developer agent is doing in real time.
"""
import threading

_lock = threading.Lock()
_progress: dict[str, str] = {}


def set_step(task_id: str, message: str) -> None:
    """Record the current step for a task."""
    if not task_id:
        return
    with _lock:
        _progress[task_id] = message


def get_step(task_id: str) -> str:
    """Return the last recorded step message, or empty string."""
    with _lock:
        return _progress.get(task_id, "")


def clear(task_id: str) -> None:
    """Remove progress entry when a task finishes."""
    with _lock:
        _progress.pop(task_id, None)
