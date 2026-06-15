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


def _worktree_path(branch_name: str) -> str:
    repo = settings.repo_path
    return os.path.join(repo, ".git", "worktrees-ai", branch_name)


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
        worktree = _worktree_path(branch_name)

        # Remove stale worktree if it exists
        if os.path.exists(worktree):
            subprocess.run(["git", "worktree", "remove", "--force", worktree], cwd=repo)

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
