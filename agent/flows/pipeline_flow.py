import logging
import re
import subprocess

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

    def _override(self, agent_id: str) -> dict | None:
        for cfg in self.state.agent_configs:
            if cfg.id == agent_id:
                return {"role": cfg.role, "goal": cfg.goal, "description": cfg.description}
        return None

    def _branch_name(self) -> str:
        """Generate a deterministic branch name: feat/{task_id}_{title_slug}."""
        title = self.state.enriched_title or self.state.title
        slug = re.sub(r'[^a-z0-9]+', '_', title.lower()).strip('_')[:40]
        return f"feat/{self.state.task_id}_{slug}"

    def _get_changed_files(self, branch_name: str) -> list[str]:
        """Read the list of files changed on the branch vs HEAD using git diff."""
        repo = self.state.repo_path or settings.repo_path
        result = subprocess.run(
            ["git", "diff", "--name-only", f"HEAD...{branch_name}"],
            cwd=repo,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.warning("git diff failed for branch %s: %s", branch_name, result.stderr)
            return []
        return [f.strip() for f in result.stdout.strip().splitlines() if f.strip()]

    @start()
    def step_enrich(self) -> None:
        _log(self.state, "enricher", "started", "Enriching task title and description")
        self.state.status = AiStatus.enriching

        result = EnricherCrew(override=self._override("enricher")).crew().kickoff(
            inputs={"title": self.state.title, "description": self.state.description}
        )
        output = result.pydantic
        self.state.enriched_title = output.enriched_title
        self.state.enriched_description = output.enriched_description
        _log(self.state, "enricher", "completed", f"Title: {self.state.enriched_title[:80]}")

    @listen(step_enrich)
    def step_spec(self) -> None:
        _log(self.state, "spec", "started", "Generating acceptance criteria and implementation plan")

        result = SpecCrew(override=self._override("spec")).crew().kickoff(
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

        branch = self._branch_name()

        result = DeveloperCrew(task_id=self.state.task_id, override=self._override("developer"), repo_path=self.state.repo_path).crew().kickoff(
            inputs={
                "title": self.state.enriched_title,
                "implementation_plan": self.state.implementation_plan,
                "acceptance_criteria": self.state.acceptance_criteria,
                "task_id": self.state.task_id,
                "branch_name": branch,
            }
        )
        output = result.pydantic

        # Trust our own slug, not the LLM's text output
        self.state.branch_name = branch
        self.state.tests_pass = output.tests_pass
        # Read actual changed files from git instead of relying on LLM self-reporting
        self.state.changed_files = self._get_changed_files(branch)
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

        result = QACrew(override=self._override("qa"), repo_path=self.state.repo_path).crew().kickoff(
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

        result = POCrew(override=self._override("po")).crew().kickoff(
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
