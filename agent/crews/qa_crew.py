from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings
from tools.git_tool import ReadDiffTool
from tools.npm_tool import NpmTestTool


class QAOutput(BaseModel):
    qa_passed: bool
    feedback: str


class QACrew:
    def crew(self) -> Crew:
        repo = settings.repo_path
        diff_tool = ReadDiffTool(repo_path=repo)
        test_tool = NpmTestTool(repo_path=repo)

        qa_agent = Agent(
            role="QA Engineer",
            goal=(
                "Review the implementation diff against acceptance criteria "
                "and confirm the test suite passes"
            ),
            backstory=(
                "You are a meticulous QA engineer who reads git diffs and test results "
                "to verify that implementations satisfy acceptance criteria. "
                "You provide structured pass/fail verdicts with actionable feedback."
            ),
            tools=[diff_tool, test_tool],
            llm=settings.openai_model,
            verbose=False,
        )

        task = Task(
            description=(
                "Review the implementation on branch {branch_name}.\n\n"
                "Acceptance criteria:\n{acceptance_criteria}\n\n"
                "Steps:\n"
                "1. Use read_git_diff to inspect changes on {branch_name}\n"
                "2. Use run_npm_tests to confirm the test suite still passes\n"
                "3. Check whether the diff satisfies every acceptance criterion\n"
                "4. Return qa_passed (bool) and detailed feedback explaining your verdict"
            ),
            expected_output="A JSON object with qa_passed (bool) and feedback (string)",
            agent=qa_agent,
            output_pydantic=QAOutput,
        )

        return Crew(
            agents=[qa_agent],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
