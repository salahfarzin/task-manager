import subprocess
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

from config import settings


class AiderInput(BaseModel):
    instruction: str


class AiderTool(BaseTool):
    """Runs Aider headless to apply code changes described by a plain-language instruction."""

    name: str = "aider_coder"
    description: str = (
        "Run Aider headless to modify source code files. "
        "Pass a precise instruction describing what changes to make. "
        "Returns Aider's stdout/stderr output."
    )
    args_schema: Type[BaseModel] = AiderInput
    repo_path: str = ""

    def _run(self, instruction: str) -> str:
        repo = self.repo_path or settings.repo_path
        result = subprocess.run(
            [
                settings.aider_path,
                "--yes",
                "--no-git",
                "--message",
                instruction,
            ],
            cwd=repo,
            capture_output=True,
            text=True,
            timeout=300,
        )
        output = (result.stdout + result.stderr).strip()
        # Truncate to avoid LLM context overflow
        return output[-6000:] if len(output) > 6000 else output
