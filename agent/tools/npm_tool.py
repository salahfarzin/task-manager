import subprocess
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

from config import settings


class NpmTestInput(BaseModel):
    branch_name: str = ""


class NpmTestTool(BaseTool):
    """Runs `npm run test:ci` in the repository and returns pass/fail output."""

    name: str = "run_npm_tests"
    description: str = (
        "Run the full Vitest test suite (`npm run test:ci`) in the repository. "
        "Returns exit code and last 4 KB of output. Exit code 0 means all tests pass."
    )
    args_schema: Type[BaseModel] = NpmTestInput
    repo_path: str = ""

    def _run(self, branch_name: str = "") -> str:
        repo = self.repo_path or settings.repo_path

        result = subprocess.run(
            ["npm", "run", "test:ci"],
            cwd=repo,
            capture_output=True,
            text=True,
            timeout=180,
        )
        combined = result.stdout + result.stderr
        tail = combined[-4000:] if len(combined) > 4000 else combined
        return f"Exit code: {result.returncode}\n{tail}"
