"""Test runner tool — auto-detects the appropriate test command for any project.

Detection order (first match wins):
  1. Explicit override via ``test_command`` field on the tool instance
  2. ``Makefile`` with ``test`` or ``tests`` target  → ``make test[s]``
     (checked first so Docker-wrapped test suites like Laravel/psychometrist work)
  3. ``package.json`` with a ``test:ci`` script       → ``npm run test:ci``
  4. ``package.json`` with a ``test`` script          → ``npm test``
  5. ``vendor/bin/phpunit`` present                   → ``{abs_path}/vendor/bin/phpunit``
  6. ``phpunit.xml`` / ``phpunit.xml.dist``           → same as above
  7. ``go.mod``                                        → ``go test ./...``
  8. ``pytest.ini`` / ``pyproject.toml`` / ``setup.py``/``setup.cfg`` → ``python -m pytest``
  9. ``Cargo.toml``                                   → ``cargo test``
 10. Fallback: clear error message

Dependency directories (vendor/, node_modules/, .venv/, venv/) are symlinked
from the main repo into the worktree automatically so tests can run without
reinstalling packages.
"""
import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

import progress
from config import settings
from tools.git_tool import _worktree_path


# Ignored dep directories that git doesn't track but tests need.
_DEP_DIRS = [
    "vendor",        # PHP / Composer
    "node_modules",  # Node.js / npm / yarn
    ".venv",         # Python virtualenv (dotfile style)
    "venv",          # Python virtualenv (plain style)
]

# Gitignored files (not directories) to symlink into the worktree.
# .env is critical for Docker Compose: it provides variable substitution
# (${NETWORK}, ${SITE_URL}, etc.) and the COMPOSE_PROJECT_NAME so that
# `docker compose exec` can find the containers started from the main repo.
_DEP_FILES = [
    ".env",
]


class NpmTestInput(BaseModel):
    branch_name: str = ""


def _ensure_dep_dirs(cwd: str, main_repo: str) -> None:
    """Symlink gitignored dirs and files from main_repo into the worktree.

    Git worktrees share commit history but not untracked/gitignored files.
    Symlinking avoids reinstalling packages and ensures Docker Compose finds
    the right environment and project when run from the worktree directory.

    Skips any item that already exists in the worktree.
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

    for dep_file in _DEP_FILES:
        target_in_worktree = os.path.join(cwd, dep_file)
        source_in_repo = os.path.join(main_repo, dep_file)

        if os.path.exists(target_in_worktree):
            continue
        if not os.path.isfile(source_in_repo):
            continue

        try:
            os.symlink(source_in_repo, target_in_worktree)
        except OSError:
            pass


def _makefile_test_target(cwd: str) -> list[str] | None:
    """Return [make, <target>] if the Makefile defines a test/tests target, else None."""
    makefile = os.path.join(cwd, "Makefile")
    if not os.path.isfile(makefile):
        return None
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


def _detect_test_command(cwd: str) -> list[str] | None:
    """Return the command list for the best matching test runner, or None.

    Detection order (first match wins):
      1. Makefile with ``test`` or ``tests`` target — preferred even for PHP/Node
         projects because the Makefile is the project's canonical entrypoint and
         may route through Docker or other wrappers not available on the host.
      2. package.json ``test:ci`` / ``test`` script
      3. vendor/bin/phpunit (or phpunit.xml config)
      4. go.mod
      5. pytest markers
      6. Cargo.toml
    """

    # --- Makefile first: may wrap Docker/make for PHP, Node, etc. ---
    make_cmd = _makefile_test_target(cwd)
    if make_cmd:
        return make_cmd

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

    return None


def _uses_docker_compose_exec(cwd: str) -> bool:
    """Return True if the Makefile's test target uses 'docker compose exec'."""
    makefile = os.path.join(cwd, "Makefile")
    if not os.path.isfile(makefile):
        return False
    try:
        return "docker compose exec" in Path(makefile).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False


# Files produced by aider itself — never sync these to the main repo.
_AIDER_ARTIFACTS = {".aider.chat.history.md", ".aider.input.history"}


def _sync_worktree_to_main(worktree: str, main_repo: str) -> list[str]:
    """Copy files changed/added in the worktree (vs HEAD) to the main repo.

    The running Docker container mounts the main repo, not the worktree.
    Syncing ensures the container sees the code aider wrote before tests run.
    Skips aider history files and .git artifacts.
    Returns a list of relative file paths that were copied.
    """
    # Tracked files modified by aider (--no-git means nothing is committed)
    diff = subprocess.run(
        ["git", "diff", "HEAD", "--name-only"],
        cwd=worktree, capture_output=True, text=True,
    )
    # Untracked new files aider may have created
    untracked = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=worktree, capture_output=True, text=True,
    )

    candidates = (
        diff.stdout.strip().splitlines()
        + untracked.stdout.strip().splitlines()
    )

    synced: list[str] = []
    for rel_path in candidates:
        if not rel_path:
            continue
        filename = os.path.basename(rel_path)
        if filename in _AIDER_ARTIFACTS or rel_path.startswith(".git"):
            continue
        src = os.path.join(worktree, rel_path)
        dst = os.path.join(main_repo, rel_path)
        if not os.path.isfile(src):
            continue
        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            synced.append(rel_path)
        except OSError:
            pass

    return synced


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
    task_id: str = ""

    def _run(self, branch_name: str = "") -> str:
        progress.set_step(self.task_id, "Running tests...")
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

        # Docker Compose projects: the running containers mount the MAIN REPO,
        # not the worktree.  We must sync aider's changes there before running
        # `docker compose exec`, and set COMPOSE_PROJECT_NAME so docker compose
        # can find the containers started from the main repo directory.
        run_cwd = cwd
        run_env = None
        sync_note = ""
        if cwd != repo and _uses_docker_compose_exec(cwd):
            synced = _sync_worktree_to_main(cwd, repo)
            project_name = os.path.basename(os.path.abspath(repo))
            run_env = {**os.environ, "COMPOSE_PROJECT_NAME": project_name}
            run_cwd = repo
            sync_note = (
                f"[Synced {len(synced)} file(s) to main repo for Docker: "
                + ", ".join(synced[:5])
                + ("..." if len(synced) > 5 else "")
                + f"]\n[COMPOSE_PROJECT_NAME={project_name}]\n"
            )
            progress.set_step(
                self.task_id,
                f"Running tests (docker, synced {len(synced)} file(s))...",
            )

        result = subprocess.run(
            cmd,
            cwd=run_cwd,
            env=run_env,
            capture_output=True,
            text=True,
            timeout=300,
        )
        combined = result.stdout + result.stderr
        tail = combined[-4000:] if len(combined) > 4000 else combined
        return f"{sync_note}Exit code: {result.returncode}\n{tail}"

