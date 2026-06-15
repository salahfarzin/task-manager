import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from flows.pipeline_flow import PipelineFlow
from models.task import AiStatus, PipelineState, ProcessRequest, StatusResponse

logger = logging.getLogger(__name__)

# In-memory pipeline state store (keyed by task_id)
_states: dict[str, PipelineState] = {}

_TERMINAL_STATUSES = {AiStatus.approved, AiStatus.rejected}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Agent service ready on %s:%d", settings.agent_host, settings.agent_port)
    yield


app = FastAPI(title="Task Manager Agent Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _run_pipeline(state: PipelineState) -> None:
    try:
        flow = PipelineFlow()
        await asyncio.to_thread(flow.kickoff, inputs=state.model_dump(mode="json"))
        _states[state.task_id] = flow.state
    except Exception as exc:
        logger.exception("Pipeline failed for task %s", state.task_id)
        current = _states.get(state.task_id, state)
        current.status = AiStatus.rejected
        current.error = str(exc)
        _states[state.task_id] = current


@app.post("/api/tasks/{task_id}/process", status_code=202)
async def process_task(
    task_id: str,
    body: ProcessRequest,
    background_tasks: BackgroundTasks,
):
    existing = _states.get(task_id)
    if existing and existing.status not in _TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail="Task is already being processed")

    state = PipelineState(
        task_id=task_id,
        title=body.title,
        description=body.description,
        tags=body.tags,
    )
    _states[task_id] = state
    background_tasks.add_task(_run_pipeline, state)
    return {"task_id": task_id, "status": "queued"}


@app.get("/api/tasks/{task_id}/status", response_model=StatusResponse)
def get_task_status(task_id: str):
    state = _states.get(task_id)
    if not state:
        raise HTTPException(status_code=404, detail="Task not found")

    return StatusResponse(
        task_id=state.task_id,
        status=state.status,
        log=state.log,
        error=state.error,
        branch_name=state.branch_name or None,
        enriched_title=state.enriched_title or None,
        enriched_description=state.enriched_description or None,
        acceptance_criteria=state.acceptance_criteria or None,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.agent_host,
        port=settings.agent_port,
        reload=True,
    )
