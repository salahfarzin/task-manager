import subprocess
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

from config import settings


class BranchInput(BaseModel):
    branch_name: str


class DiffInput(BaseModel):
    branch_name: str


class CreateBranchTool(BaseTool):
    """Creates (or resets) a git branch and stages+commits all working-tree changes."""

    name: str = "create_git_branch"
    description: str = (
        "Create or reset a git branch in the repository, "
        "then stage and commit all current changes to it."
    )
    args_schema: Type[BaseModel] = BranchInput
    repo_path: str = ""

    def _run(self, branch_name: str) -> str:
        repo = self.repo_path or settings.repo_path

        checkout = subprocess.run(
            ["git", "checkout", "-B", branch_name],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        if checkout.returncode != 0:
            return f"Error creating branch: {checkout.stderr}"

        subprocess.run(["git", "add", "-A"], cwd=repo)
        commit = subprocess.run(
            ["git", "commit", "-m", f"feat: AI implementation on {branch_name}", "--allow-empty"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        return f"Branch '{branch_name}' ready. Commit: {commit.stdout.strip()}"


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
            ["git", "diff", f"dev...{branch_name}", "--stat"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        diff = subprocess.run(
            ["git", "diff", f"dev...{branch_name}"],
            cwd=repo,
            capture_output=True,
            text=True,
        )

        if stat.returncode != 0:
            return f"Error reading diff: {stat.stderr}"

        full = f"=== STAT ===\n{stat.stdout}\n=== DIFF ===\n{diff.stdout}"
        return full[:8000]
