from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings
from tools.aider_tool import AiderTool
from tools.git_tool import CreateBranchTool
from tools.npm_tool import NpmTestTool


class DeveloperOutput(BaseModel):
    branch_name: str
    tests_pass: bool
    test_output: str


class DeveloperCrew:
    def __init__(self, task_id: str, override: dict | None = None, repo_path: str | None = None) -> None:
        self.task_id = task_id
        self._override = override or {}
        self._repo_path = repo_path or settings.repo_path

    def crew(self) -> Crew:
        repo = self._repo_path
        branch_tool = CreateBranchTool(repo_path=repo)
        aider_tool = AiderTool(repo_path=repo)
        test_tool = NpmTestTool(repo_path=repo)

        developer = Agent(
            role=self._override.get("role", "Senior Software Developer"),
            goal=self._override.get(
                "goal",
                "Create a feature branch, implement the task using Aider, verify all tests pass",
            ),
            backstory=self._override.get(
                "description",
                (
                    "You are a principal engineer who uses AI coding tools (Aider) to implement features "
                    "precisely. You always verify that the test suite passes before declaring success. "
                    "If tests fail, you iterate with Aider using the error output as context."
                ),
            ),
            tools=[branch_tool, aider_tool, test_tool],
            llm=settings.llm_model,
            verbose=True,
        )

        task = Task(
            description=(
                "Implement the following feature in the codebase.\n\n"
                "Title: {title}\n"
                "Implementation plan:\n{implementation_plan}\n\n"
                "Acceptance criteria:\n{acceptance_criteria}\n\n"
                "Steps:\n"
                "1. Use create_git_branch to create branch feat/ai-{task_id}\n"
                "2. Use aider_coder with a clear instruction derived from the implementation plan\n"
                "3. Use run_npm_tests to verify tests pass\n"
                "4. If tests fail, call aider_coder again with the failure output to fix issues\n"
                "5. Repeat steps 3-4 up to 2 more times if needed\n"
                "6. Return branch_name, tests_pass, and test_output"
            ),
            expected_output=(
                "A JSON object with branch_name (string), tests_pass (bool), test_output (string)"
            ),
            agent=developer,
            output_pydantic=DeveloperOutput,
        )

        return Crew(
            agents=[developer],
            tasks=[task],
            process=Process.sequential,
            verbose=True,
        )
