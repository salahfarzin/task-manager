import logging

from crewai.flow.flow import Flow, listen, router, start

from config import settings
from crews.developer_crew import DeveloperCrew
from crews.enricher_crew import EnricherCrew
from crews.po_crew import POCrew
from crews.qa_crew import QACrew
from crews.spec_crew import SpecCrew
from models.task import AgentLogEntry, AiStatus, PipelineState

logger = logging.getLogger(__name__)


def _log(state: PipelineState, agent: str, status: str, message: str) -> None:
    state.log.append(AgentLogEntry(agent=agent, status=status, message=message))
    logger.info("[%s] %s — %s: %s", state.task_id, agent, status, message)


class PipelineFlow(Flow[PipelineState]):

    @start()
    def step_enrich(self) -> None:
        _log(self.state, "enricher", "started", "Enriching task title and description")
        self.state.status = AiStatus.enriching

        result = EnricherCrew().crew().kickoff(
            inputs={"title": self.state.title, "description": self.state.description}
        )
        output = result.pydantic
        self.state.enriched_title = output.enriched_title
        self.state.enriched_description = output.enriched_description
        _log(self.state, "enricher", "completed", f"Title: {self.state.enriched_title[:80]}")

    @listen(step_enrich)
    def step_spec(self) -> None:
        _log(self.state, "spec", "started", "Generating acceptance criteria and implementation plan")

        result = SpecCrew().crew().kickoff(
            inputs={
                "title": self.state.enriched_title,
                "description": self.state.enriched_description,
            }
        )
        output = result.pydantic
        self.state.acceptance_criteria = output.acceptance_criteria
        self.state.implementation_plan = output.implementation_plan
        _log(self.state, "spec", "completed", "Spec generated")

    @listen(step_spec)
    def step_implement(self) -> None:
        attempt = self.state.implement_retries + 1
        _log(self.state, "developer", "started", f"Implementing (attempt {attempt})")
        self.state.status = AiStatus.implementing

        result = DeveloperCrew(task_id=self.state.task_id).crew().kickoff(
            inputs={
                "title": self.state.enriched_title,
                "implementation_plan": self.state.implementation_plan,
                "acceptance_criteria": self.state.acceptance_criteria,
                "task_id": self.state.task_id,
            }
        )
        output = result.pydantic
        self.state.branch_name = output.branch_name
        self.state.tests_pass = output.tests_pass
        self.state.implement_retries += 1

        log_status = "completed" if self.state.tests_pass else "failed"
        _log(
            self.state,
            "developer",
            log_status,
            f"Branch: {self.state.branch_name} | Tests pass: {self.state.tests_pass}",
        )

    @router(step_implement)
    def route_after_implement(self) -> str:
        if self.state.tests_pass:
            return "qa"

        if self.state.implement_retries < settings.max_implement_retries:
            return "implement"

        _log(
            self.state,
            "developer",
            "failed",
            f"Exceeded max retries ({settings.max_implement_retries}). Rejecting task.",
        )
        self.state.status = AiStatus.rejected
        return "end"

    @listen("qa")
    def step_qa(self) -> None:
        _log(self.state, "qa", "started", "Reviewing implementation against acceptance criteria")
        self.state.status = AiStatus.qa_review

        result = QACrew().crew().kickoff(
            inputs={
                "acceptance_criteria": self.state.acceptance_criteria,
                "branch_name": self.state.branch_name,
            }
        )
        output = result.pydantic
        self.state.qa_passed = output.qa_passed
        self.state.qa_feedback = output.feedback

        log_status = "completed" if self.state.qa_passed else "failed"
        _log(self.state, "qa", log_status, self.state.qa_feedback[:200])

    @router(step_qa)
    def route_after_qa(self) -> str:
        if self.state.qa_passed:
            return "po"

        if self.state.implement_retries < settings.max_implement_retries:
            _log(self.state, "qa", "started", "Sending back to developer for fixes")
            return "implement"

        self.state.status = AiStatus.rejected
        return "end"

    @listen("po")
    def step_po(self) -> None:
        _log(self.state, "po", "started", "PO reviewing acceptance criteria compliance")
        self.state.status = AiStatus.po_review

        result = POCrew().crew().kickoff(
            inputs={
                "title": self.state.enriched_title,
                "acceptance_criteria": self.state.acceptance_criteria,
                "qa_feedback": self.state.qa_feedback,
                "branch_name": self.state.branch_name,
            }
        )
        output = result.pydantic
        self.state.po_approved = output.approved
        self.state.po_feedback = output.feedback
        self.state.status = AiStatus.approved if self.state.po_approved else AiStatus.rejected

        log_status = "completed" if self.state.po_approved else "failed"
        _log(self.state, "po", log_status, self.state.po_feedback[:200])
