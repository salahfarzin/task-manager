from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings


class EnricherOutput(BaseModel):
    enriched_title: str
    enriched_description: str


class EnricherCrew:
    def __init__(self, override: dict | None = None) -> None:
        self._override = override or {}

    def crew(self) -> Crew:
        enricher = Agent(
            role=self._override.get("role", "Technical Ticket Enricher"),
            goal=self._override.get(
                "goal",
                (
                    "Rewrite task titles and descriptions to be clear, actionable, "
                    "and developer-friendly using INVEST criteria"
                ),
            ),
            backstory=self._override.get(
                "description",
                (
                    "You are an experienced engineering manager who translates vague requirements "
                    "into precise, well-scoped engineering tickets. "
                    "You follow INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)."
                ),
            ),
            llm=settings.llm_model,
            verbose=False,
        )

        task = Task(
            description=(
                "Rewrite the following kanban task.\n\n"
                "Original title: {title}\n"
                "Original description: {description}\n\n"
                "Rules:\n"
                "- enriched_title: ≤80 chars, imperative verb, no jargon\n"
                "- enriched_description: preserve HTML, clarify intent without adding new features"
            ),
            expected_output=(
                "A JSON object with enriched_title (string ≤80 chars) "
                "and enriched_description (HTML string)"
            ),
            agent=enricher,
            output_pydantic=EnricherOutput,
        )

        return Crew(
            agents=[enricher],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
