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
                "Rewrite the following kanban task into a structured engineering ticket.\n\n"
                "Original title: {title}\n"
                "Original description: {description}\n\n"
                "Rules for enriched_title:\n"
                "- ≤80 characters, imperative verb, no jargon\n\n"
                "Rules for enriched_description:\n"
                "- Produce a fully filled-out ticket in this EXACT markdown template.\n"
                "- Fill every section based on the original title and description.\n"
                "- Do NOT leave placeholder text like '...' or 'N/A' — infer from context.\n"
                "- Keep the section headers exactly as shown.\n\n"
                "TEMPLATE:\n"
                "## Summary\n"
                "{{ one-line description }}\n\n"
                "## Background / Context\n"
                "{{ why this ticket exists }}\n\n"
                "## Scope\n"
                "**In scope:**\n"
                "- {{item}}\n\n"
                "**Out of scope:**\n"
                "- {{item}}\n\n"
                "## Technical Approach\n"
                "{{implementation approach, relevant services, architecture decisions}}\n\n"
                "## Acceptance Criteria\n"
                "- {{criterion}}\n\n"
                "## Definition of Done\n"
                "- Code reviewed and merged\n"
                "- Tests passing\n"
                "- Deployed to dev/staging and smoke-tested\n"
                "- Documentation updated\n\n"
                "## Notes / Open Questions\n"
                "{{any open questions or risks}}"
            ),
            expected_output=(
                "A JSON object with:\n"
                "- enriched_title: string ≤80 chars\n"
                "- enriched_description: the fully rendered markdown ticket (no HTML)"
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
