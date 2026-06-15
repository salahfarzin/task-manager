from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AiStatus(str, Enum):
    idle = "idle"
    queued = "queued"
    enriching = "enriching"
    implementing = "implementing"
    qa_review = "qa_review"
    po_review = "po_review"
    approved = "approved"
    rejected = "rejected"


class AgentLogEntry(BaseModel):
    agent: str
    status: str  # started | completed | failed
    message: str


class MicroserviceInfo(BaseModel):
    id: str
    name: str
    url: str
    repo_path: Optional[str] = None
    description: str = ""


class AgentOverride(BaseModel):
    id: str
    name: str
    role: str
    goal: str
    description: str


class PipelineState(BaseModel):
    task_id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    repo_path: Optional[str] = None
    microservices: list[MicroserviceInfo] = Field(default_factory=list)
    agent_configs: list[AgentOverride] = Field(default_factory=list)

    # Enricher output
    enriched_title: str = ""
    enriched_description: str = ""

    # Spec output
    acceptance_criteria: str = ""
    implementation_plan: str = ""

    # Developer output
    branch_name: str = ""
    tests_pass: bool = False
    changed_files: list[str] = Field(default_factory=list)
    implement_retries: int = 0

    # QA output
    qa_passed: bool = False
    qa_feedback: str = ""

    # PO output
    po_approved: bool = False
    po_feedback: str = ""

    # Pipeline tracking
    status: AiStatus = AiStatus.queued
    log: list[AgentLogEntry] = Field(default_factory=list)
    error: Optional[str] = None


class AgentOverride(BaseModel):
    id: str
    name: str
    role: str
    goal: str
    description: str


class ProcessRequest(BaseModel):
    task_id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    repo_path: Optional[str] = None
    microservices: list[MicroserviceInfo] = Field(default_factory=list)
    agent_configs: list[AgentOverride] = Field(default_factory=list)


class StatusResponse(BaseModel):
    task_id: str
    status: AiStatus
    log: list[AgentLogEntry]
    error: Optional[str] = None
    branch_name: Optional[str] = None
    enriched_title: Optional[str] = None
    enriched_description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    changed_files: list[str] = Field(default_factory=list)
    qa_feedback: Optional[str] = None
    po_feedback: Optional[str] = None
