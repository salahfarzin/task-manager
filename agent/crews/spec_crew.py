from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings


class SpecOutput(BaseModel):
    acceptance_criteria: str
    implementation_plan: str


class SpecCrew:
    def __init__(self, override: dict | None = None) -> None:
        self._override = override or {}

    def crew(self) -> Crew:
        spec_writer = Agent(
            role=self._override.get("role", "Software Specification Writer"),
            goal=self._override.get("goal", "Generate BDD acceptance criteria and a numbered implementation plan"),
            backstory=self._override.get(
                "description",
                (
                    "You are a senior software architect who writes precise BDD-style acceptance criteria "
                    "(Given/When/Then) and breaks features into small, testable implementation steps. "
                    "You never over-engineer: max 7 implementation steps."
                ),
            ),
            llm=settings.llm_model,
            verbose=False,
        )

        task = Task(
            description=(
                "Given this enriched task, produce:\n"
                "1. acceptance_criteria — BDD format (Given/When/Then), one scenario per line\n"
                "2. implementation_plan — numbered list, max 7 steps, each ≤2 sentences\n\n"
                "Task title: {title}\n"
                "Description: {description}"
            ),
            expected_output=(
                "A JSON object with acceptance_criteria (string) and implementation_plan (string)"
            ),
            agent=spec_writer,
            output_pydantic=SpecOutput,
        )

        return Crew(
            agents=[spec_writer],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
