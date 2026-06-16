import os
import subprocess
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

from config import settings


class BranchInput(BaseModel):
    branch_name: str


class DiffInput(BaseModel):
    branch_name: str


def _worktree_path(repo: str, branch_name: str) -> str:
    """Return the filesystem path for a git worktree.

    Worktrees are placed next to the repo, never inside .git:
      {parent}/.worktrees-ai/{repo_name}/{safe_branch}

    Branch name slashes are replaced with dashes so the branch name
    becomes a valid single directory component.
    """
    safe_name = branch_name.replace("/", "-")
    repo_abs = os.path.abspath(repo)
    return os.path.join(
        os.path.dirname(repo_abs),
        ".worktrees-ai",
        os.path.basename(repo_abs),
        safe_name,
    )


class CreateBranchTool(BaseTool):
    """Creates an isolated git worktree for the branch so the main checkout is never touched."""

    name: str = "create_git_branch"
    description: str = (
        "Create an isolated git worktree for a feature branch. "
        "Returns the worktree path where Aider should make changes."
    )
    args_schema: Type[BaseModel] = BranchInput
    repo_path: str = ""

    def _run(self, branch_name: str) -> str:
        repo = self.repo_path or settings.repo_path
        worktree = _worktree_path(repo, branch_name)

        if not os.path.isdir(repo):
            return f"Error: repo_path '{repo}' does not exist on disk."

        # Reuse the existing worktree — a valid worktree always has a .git *file*
        # (not directory) at its root pointing back to the main repo.
        # Returning early here preserves any work already done by aider on retries.
        if os.path.isdir(worktree) and os.path.isfile(os.path.join(worktree, ".git")):
            return f"Worktree already exists at {worktree} on branch '{branch_name}' — reusing."

        # Stale directory without a valid .git file — prune and clean up before recreating.
        if os.path.exists(worktree):
            subprocess.run(["git", "worktree", "prune"], cwd=repo, capture_output=True)
            subprocess.run(["git", "worktree", "remove", "--force", worktree], cwd=repo, capture_output=True)

        os.makedirs(os.path.dirname(worktree), exist_ok=True)

        result = subprocess.run(
            ["git", "worktree", "add", "-B", branch_name, worktree, "HEAD"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return f"Error creating worktree: {result.stderr}"

        return f"Worktree ready at {worktree} on branch '{branch_name}'"


class ReadDiffTool(BaseTool):
    """Reads the git diff between a feature branch and the base branch."""

    name: str = "read_git_diff"
    description: str = (
        "Read the git diff for a feature branch against the base branch (dev). "
        "Returns a condensed diff summary plus up to 8 KB of unified diff."
    )
    args_schema: Type[BaseModel] = DiffInput
    repo_path: str = ""

    def _run(self, branch_name: str) -> str:
        repo = self.repo_path or settings.repo_path

        stat = subprocess.run(
            ["git", "diff", f"HEAD...{branch_name}", "--stat"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        diff = subprocess.run(
            ["git", "diff", f"HEAD...{branch_name}"],
            cwd=repo,
            capture_output=True,
            text=True,
        )

        if stat.returncode != 0:
            return f"Error reading diff: {stat.stderr}"

        full = f"=== STAT ===\n{stat.stdout}\n=== DIFF ===\n{diff.stdout}"
        return full[:8000]
