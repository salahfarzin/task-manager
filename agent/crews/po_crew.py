from crewai import Agent, Crew, Process, Task
from pydantic import BaseModel

from config import settings


class POOutput(BaseModel):
    approved: bool
    feedback: str


class POCrew:
    def crew(self) -> Crew:
        po_agent = Agent(
            role="Product Owner",
            goal=(
                "Validate that the completed feature meets all business requirements "
                "and acceptance criteria before approving it for merge"
            ),
            backstory=(
                "You are a product owner who evaluates completed features with a business lens. "
                "You approve features that fully satisfy acceptance criteria and reject those that don't, "
                "providing specific, actionable feedback for each rejection."
            ),
            llm=settings.openai_model,
            verbose=False,
        )

        task = Task(
            description=(
                "Evaluate the completed implementation.\n\n"
                "Feature title: {title}\n"
                "Acceptance criteria:\n{acceptance_criteria}\n\n"
                "QA feedback:\n{qa_feedback}\n\n"
                "Branch: {branch_name}\n\n"
                "Based on the QA feedback and acceptance criteria:\n"
                "- Set approved=true if all criteria are demonstrably met\n"
                "- Set approved=false with specific, actionable feedback if any criterion is unmet"
            ),
            expected_output="A JSON object with approved (bool) and feedback (string)",
            agent=po_agent,
            output_pydantic=POOutput,
        )

        return Crew(
            agents=[po_agent],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
