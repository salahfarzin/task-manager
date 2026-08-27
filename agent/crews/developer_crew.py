from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings
from tools.aider_tool import AiderTool
from tools.git_tool import CreateBranchTool
from tools.npm_tool import NpmTestTool
from tools.setup_ai_context_tool import SetupAiContextTool


class DeveloperOutput(BaseModel):
    branch_name: str
    tests_pass: bool
    test_output: str


class DeveloperCrew:
    def __init__(self, task_id: str, override: dict | None = None, repo_path: str | None = None, test_command: str = "") -> None:
        self.task_id = task_id
        self._override = override or {}
        self._repo_path = repo_path or settings.repo_path
        self._test_command = test_command

    def crew(self) -> Crew:
        repo = self._repo_path
        branch_tool = CreateBranchTool(repo_path=repo, task_id=self.task_id)
        aider_tool = AiderTool(repo_path=repo, task_id=self.task_id)
        test_tool = NpmTestTool(repo_path=repo, test_command=self._test_command, task_id=self.task_id)
        context_tool = SetupAiContextTool(repo_path=repo, task_id=self.task_id)

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
            tools=[branch_tool, aider_tool, test_tool, context_tool],
            llm=settings.llm_model,
            verbose=True,
        )

        task = Task(
            description=(
                "CRITICAL RULES — you must never violate these:\n"
                "- NEVER assess or check the environment before calling tools.\n"
                "- NEVER refuse to act due to suspected missing runtimes (php, python, node, ruby, etc.).\n"
                "- NEVER mention pyaudioop, audioop, or any Python internals.\n"
                "- NEVER output 'Critical environment issues detected' or any pre-flight refusal.\n"
                "- If a tool returns an error, record that error in test_output and set tests_pass=False.\n"
                "- You MUST always call create_git_branch as your very first action. No exceptions.\n\n"
                "Implement the following feature in the codebase.\n\n"
                "Title: {title}\n"
                "Implementation plan:\n{implementation_plan}\n\n"
                "Acceptance criteria:\n{acceptance_criteria}\n\n"
                "Steps:\n"
                "1. Call create_git_branch with branch_name={branch_name}.\n"
                "   If it says 'already exists — reusing', the branch has previous work — do NOT redo the full implementation.\n"
                "2. Call setup_ai_context with branch_name={branch_name}.\n"
                "   READ the returned context carefully before writing any code — it tells\n"
                "   you the tech stack, Docker services, and how to run tests (e.g. make tests).\n"
                "   If Docker Compose services are listed, runtimes like PHP/Node/Python\n"
                "   run INSIDE containers — never call them directly on the host.\n"
                "   Existing files are never overwritten, so it is safe to call every time.\n"
                "3. If {is_retry} is True and {previous_test_output} is non-empty:\n"
                "   - Run run_npm_tests first to see the current state\n"
                "   - Then call aider_coder with ONLY the targeted fix for the failures shown in:\n"
                "     {previous_test_output}\n"
                "   Otherwise: use aider_coder with the full implementation plan.\n"
                "4. Use run_npm_tests to verify tests pass\n"
                "5. If tests fail, call aider_coder again with the failure output to fix issues\n"
                "6. Repeat steps 4-5 up to 2 more times if needed\n"
                "7. Return branch_name ({branch_name}), tests_pass, and test_output"
            ),
            expected_output=(
                "A JSON object with branch_name (string, must equal {branch_name}), "
                "tests_pass (bool), test_output (string)"
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
