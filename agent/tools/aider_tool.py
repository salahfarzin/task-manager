import subprocess
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

import progress
from config import settings
from tools.git_tool import _worktree_path


class AiderInput(BaseModel):
    instruction: str
    branch_name: str = ""


class AiderTool(BaseTool):
    """Runs Aider headless inside the branch's worktree to apply code changes."""

    name: str = "aider_coder"
    description: str = (
        "Run Aider headless to modify source code files inside the feature branch worktree. "
        "Pass a precise instruction and the branch_name. "
        "Returns Aider's stdout/stderr output."
    )
    args_schema: Type[BaseModel] = AiderInput
    repo_path: str = ""
    task_id: str = ""

    def _run(self, instruction: str, branch_name: str = "") -> str:
        progress.set_step(self.task_id, "Implementing changes with Aider...")
        repo = self.repo_path or settings.repo_path
        cwd = _worktree_path(repo, branch_name) if branch_name else repo
        result = subprocess.run(
            [
                settings.aider_path,
                "--yes",
                "--no-git",
                "--message",
                instruction,
            ],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        output = (result.stdout + result.stderr).strip()
        return output[-6000:] if len(output) > 6000 else output
