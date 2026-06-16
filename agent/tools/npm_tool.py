"""Test runner tool — auto-detects the appropriate test command for any project.

Detection order (first match wins):
  1. Explicit override via ``test_command`` field on the tool instance
  2. ``package.json`` with a ``test:ci`` script       → ``npm run test:ci``
  3. ``package.json`` with a ``test`` script          → ``npm test``
  4. ``vendor/bin/phpunit`` present                   → ``{abs_path}/vendor/bin/phpunit``
  5. ``phpunit.xml`` / ``phpunit.xml.dist``           → same as above
  6. ``go.mod``                                        → ``go test ./...``
  7. ``pytest.ini`` / ``pyproject.toml`` / ``setup.py``/``setup.cfg`` → ``python -m pytest``
  8. ``Cargo.toml``                                   → ``cargo test``
  9. ``Makefile`` with ``test`` or ``tests`` target   → ``make test[s]``
 10. Fallback: clear error message

Dependency directories (vendor/, node_modules/, .venv/, venv/) are symlinked
from the main repo into the worktree automatically so tests can run without
reinstalling packages.
"""
import json
import os
import subprocess
from pathlib import Path
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

from config import settings
from tools.git_tool import _worktree_path


# Ignored dep directories that git doesn't track but tests need.
_DEP_DIRS = [
    "vendor",        # PHP / Composer
    "node_modules",  # Node.js / npm / yarn
    ".venv",         # Python virtualenv (dotfile style)
    "venv",          # Python virtualenv (plain style)
]


class NpmTestInput(BaseModel):
    branch_name: str = ""


def _ensure_dep_dirs(cwd: str, main_repo: str) -> None:
    """Symlink common dependency directories from main_repo into the worktree.

    Git worktrees share the commit history but not untracked/gitignored files.
    Symlinking avoids reinstalling packages (composer install, npm ci, etc.)
    while making them visible to the test runner in the worktree.

    Skips any dir that already exists in the worktree.
    """
    for dep_dir in _DEP_DIRS:
        target_in_worktree = os.path.join(cwd, dep_dir)
        source_in_repo = os.path.join(main_repo, dep_dir)

        if os.path.exists(target_in_worktree):
            continue
        if not os.path.isdir(source_in_repo):
            continue

        try:
            os.symlink(source_in_repo, target_in_worktree)
        except OSError:
            pass


def _detect_test_command(cwd: str) -> list[str] | None:
    """Return the command list for the best matching test runner, or None."""

    # --- Node / npm ---
    pkg_path = os.path.join(cwd, "package.json")
    if os.path.isfile(pkg_path):
        try:
            pkg = json.loads(Path(pkg_path).read_text(encoding="utf-8"))
            scripts = pkg.get("scripts", {})
            if "test:ci" in scripts:
                return ["npm", "run", "test:ci"]
            if "test" in scripts:
                return ["npm", "test"]
        except (json.JSONDecodeError, OSError):
            pass

    # --- PHP / PHPUnit (works with or without composer in PATH) ---
    phpunit_bin = os.path.join(cwd, "vendor", "bin", "phpunit")
    phpunit_cfg = next(
        (
            os.path.join(cwd, f)
            for f in ("phpunit.xml", "phpunit.xml.dist")
            if os.path.isfile(os.path.join(cwd, f))
        ),
        None,
    )
    if os.path.isfile(phpunit_bin):
        cmd = [phpunit_bin, "--no-coverage"]
        if phpunit_cfg:
            cmd += ["--configuration", phpunit_cfg]
        return cmd
    # phpunit config exists but vendor not symlinked yet — return path anyway,
    # _ensure_dep_dirs will have already tried to create the symlink.
    if phpunit_cfg:
        return [phpunit_bin, "--no-coverage", "--configuration", phpunit_cfg]

    # --- Go ---
    if os.path.isfile(os.path.join(cwd, "go.mod")):
        return ["go", "test", "./..."]

    # --- Python / pytest ---
    for marker in ("pytest.ini", "pyproject.toml", "setup.py", "setup.cfg"):
        if os.path.isfile(os.path.join(cwd, marker)):
            return ["python", "-m", "pytest"]

    # --- Rust / Cargo ---
    if os.path.isfile(os.path.join(cwd, "Cargo.toml")):
        return ["cargo", "test"]

    # --- Makefile fallback ---
    makefile = os.path.join(cwd, "Makefile")
    if os.path.isfile(makefile):
        try:
            content = Path(makefile).read_text(encoding="utf-8", errors="replace")
            targets = {
                line.split(":")[0].strip()
                for line in content.splitlines()
                if line and not line.startswith(("\t", " ")) and ":" in line
            }
            if "test" in targets:
                return ["make", "test"]
            if "tests" in targets:
                return ["make", "tests"]
        except OSError:
            pass

    return None


class NpmTestTool(BaseTool):
    """Runs the project test suite in the branch worktree.

    Works for any project type: Node/npm, PHP/PHPUnit, Go, Python/pytest,
    Rust/Cargo, or any project with a Makefile test target.

    Dependency directories (vendor/, node_modules/, .venv/, venv/) are
    automatically symlinked from the main repo so packages don't need
    reinstalling. Pass ``test_command`` to override auto-detection.

    Exit code 0 means all tests pass.
    """

    name: str = "run_npm_tests"
    description: str = (
        "Run the project test suite in the feature branch worktree. "
        "Auto-detects the test runner: npm, phpunit, go test, pytest, cargo, or make. "
        "Returns exit code and last 4 KB of output. Exit code 0 means all tests pass."
    )
    args_schema: Type[BaseModel] = NpmTestInput
    repo_path: str = ""
    test_command: str = ""  # Optional override, e.g. "make tests" or "npm run test:ci"

    def _run(self, branch_name: str = "") -> str:
        repo = self.repo_path or settings.repo_path
        cwd = _worktree_path(repo, branch_name) if branch_name else repo

        # Symlink dep dirs from main repo so tests can find installed packages.
        if branch_name and os.path.isdir(cwd):
            _ensure_dep_dirs(cwd, repo)

        if self.test_command:
            cmd = self.test_command.split()
        else:
            cmd = _detect_test_command(cwd)
            if cmd is None:
                return (
                    "Exit code: 1\n"
                    "No test runner detected. Checked: npm, phpunit, go.mod, "
                    "pytest, Cargo.toml, Makefile (test/tests target).\n"
                    "Add a test script to your package.json/composer.json "
                    "or set a custom test command in Board Settings → Test Command."
                )

        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        combined = result.stdout + result.stderr
        tail = combined[-4000:] if len(combined) > 4000 else combined
        return f"Exit code: {result.returncode}\n{tail}"

