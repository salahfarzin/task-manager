"""Tool that writes CLAUDE.md and .github/copilot-instructions.md into a repo
the first time an AI agent works on it.

Both files are only created when absent — existing files are never overwritten.
"""
import json
import os
from pathlib import Path
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel

import progress
from config import settings
from tools.git_tool import _worktree_path


class SetupAiContextInput(BaseModel):
    branch_name: str = ""


def _read_limited(path: str, max_bytes: int = 4096) -> str:
    """Return the first `max_bytes` of a file, or empty string if unreadable."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read(max_bytes)
    except OSError:
        return ""


def _gather_repo_context(root: str) -> dict:
    """Collect lightweight repo metadata without running any subprocesses."""
    ctx: dict = {"root": root, "name": os.path.basename(root)}

    # package.json → name, description, scripts, dependencies
    pkg_path = os.path.join(root, "package.json")
    if os.path.isfile(pkg_path):
        try:
            pkg = json.loads(Path(pkg_path).read_text(encoding="utf-8"))
            ctx["pkg_name"] = pkg.get("name", "")
            ctx["pkg_description"] = pkg.get("description", "")
            ctx["scripts"] = pkg.get("scripts", {})
            ctx["dependencies"] = list(pkg.get("dependencies", {}).keys())
            ctx["dev_dependencies"] = list(pkg.get("devDependencies", {}).keys())
        except (json.JSONDecodeError, OSError):
            pass

    # README (first 2 KB)
    for readme in ("README.md", "README.rst", "README.txt", "README"):
        readme_path = os.path.join(root, readme)
        if os.path.isfile(readme_path):
            ctx["readme"] = _read_limited(readme_path, 2048)
            break

    # Top-level source directories
    try:
        ctx["top_dirs"] = [
            e for e in os.listdir(root)
            if os.path.isdir(os.path.join(root, e))
            and not e.startswith(".")
            and e not in ("node_modules", "__pycache__", "dist", "build", "coverage")
        ]
    except OSError:
        ctx["top_dirs"] = []

    # Detect language / framework hints
    hints: list[str] = []
    for marker, label in [
        ("package.json",     "Node.js / JavaScript"),
        ("tsconfig.json",    "TypeScript"),
        ("vite.config.ts",   "Vite"),
        ("vite.config.js",   "Vite"),
        ("next.config.js",   "Next.js"),
        ("next.config.ts",   "Next.js"),
        ("requirements.txt", "Python"),
        ("pyproject.toml",   "Python"),
        ("Cargo.toml",       "Rust"),
        ("go.mod",           "Go"),
        ("pom.xml",          "Java/Maven"),
        ("build.gradle",     "Java/Gradle"),
        ("Gemfile",          "Ruby"),
        ("composer.json",    "PHP / Composer"),
        ("artisan",          "Laravel"),
        ("phpunit.xml",      "PHPUnit"),
        ("phpunit.xml.dist", "PHPUnit"),
        ("docker-compose.yml", "Docker Compose"),
    ]:
        if os.path.isfile(os.path.join(root, marker)):
            hints.append(label)
    ctx["tech_hints"] = hints

    # Makefile — read content to expose test/build targets
    makefile_path = os.path.join(root, "Makefile")
    if os.path.isfile(makefile_path):
        ctx["makefile"] = _read_limited(makefile_path, 3000)

    # docker-compose.yml — extract service names
    dc_path = os.path.join(root, "docker-compose.yml")
    if os.path.isfile(dc_path):
        dc_raw = _read_limited(dc_path, 8000)
        # Extract service names cheaply without YAML parsing
        services = [
            line.split(":")[0].strip()
            for line in dc_raw.splitlines()
            if line and not line.startswith((" ", "\t", "#")) and ":" in line
            and line.split(":")[0].strip() not in (
                "version", "services", "networks", "volumes", "configs", "secrets"
            )
        ]
        ctx["docker_services"] = services[:20]

    # composer.json — PHP framework and scripts
    composer_path = os.path.join(root, "composer.json")
    if os.path.isfile(composer_path):
        try:
            composer = json.loads(Path(composer_path).read_text(encoding="utf-8"))
            ctx["composer_name"] = composer.get("name", "")
            ctx["composer_description"] = composer.get("description", "")
            ctx["composer_scripts"] = list(composer.get("scripts", {}).keys())
        except (json.JSONDecodeError, OSError):
            pass

    return ctx


def _build_claude_md(ctx: dict) -> str:
    name = ctx.get("pkg_name") or ctx.get("composer_name") or ctx["name"]
    desc = ctx.get("pkg_description") or ctx.get("composer_description", "")
    hints = ", ".join(ctx["tech_hints"]) if ctx["tech_hints"] else "unknown"
    readme_excerpt = ctx.get("readme", "").strip()
    top_dirs = "  ".join(ctx.get("top_dirs", []))

    scripts_section = ""
    scripts = ctx.get("scripts", {})
    if scripts:
        lines = "\n".join(f"  {k}: {v}" for k, v in list(scripts.items())[:12])
        scripts_section = f"\n## Commands\n```\n{lines}\n```\n"

    deps = ", ".join(ctx.get("dependencies", [])[:20])
    deps_section = f"\n## Key Dependencies\n{deps}\n" if deps else ""

    docker_section = ""
    if ctx.get("docker_services"):
        svc_list = ", ".join(ctx["docker_services"])
        docker_section = (
            f"\n## Docker Services\n"
            f"This project runs in Docker Compose. Services: {svc_list}\n"
            f"IMPORTANT: Runtimes like PHP, Node, Python may only be available inside "
            f"containers, NOT on the host machine. Use `make` or `docker compose exec` "
            f"to run commands, never call runtimes directly.\n"
        )

    makefile_section = ""
    if ctx.get("makefile"):
        makefile_section = f"\n## Makefile (test/build targets)\n```\n{ctx['makefile'][:1500]}\n```\n"

    return f"""# {name}

{desc}

## Tech Stack
{hints}

## Project Structure
{top_dirs}
{scripts_section}{deps_section}{docker_section}{makefile_section}
## Notes
- Auto-generated by AI agent pipeline on first run.
- Update this file with architecture decisions, conventions, and gotchas.
{("## README excerpt\n" + readme_excerpt[:800]) if readme_excerpt else ""}
""".strip() + "\n"


def _build_copilot_instructions(ctx: dict) -> str:
    name = ctx.get("pkg_name") or ctx["name"]
    desc = ctx.get("pkg_description", "")
    hints = ", ".join(ctx["tech_hints"]) if ctx["tech_hints"] else "unknown stack"
    top_dirs = ", ".join(ctx.get("top_dirs", []))

    scripts = ctx.get("scripts", {})
    test_cmd = scripts.get("test") or scripts.get("test:ci") or "see package.json"
    build_cmd = scripts.get("build", "see package.json")
    lint_cmd = scripts.get("lint", "see package.json")

    return f"""# {name} — GitHub Copilot Instructions

## Project Overview
{desc or "No description provided."}

## Tech Stack
{hints}

## Source Layout
{top_dirs}

## Key Commands
- Test: `{test_cmd}`
- Build: `{build_cmd}`
- Lint: `{lint_cmd}`

## Coding Guidelines
- Follow existing patterns in the codebase.
- Write tests for new functionality.
- Keep PRs focused and atomic.
- Update this file when architectural decisions are made.

> Auto-generated by AI agent pipeline. Edit freely.
""".strip() + "\n"


class SetupAiContextTool(BaseTool):
    """Creates CLAUDE.md and .github/copilot-instructions.md if absent.

    Scans the worktree for package.json, README, Makefile, docker-compose.yml,
    and directory layout to build minimal but useful context files.
    Existing files are never touched.

    IMPORTANT: Returns the full project context (CLAUDE.md content) so the
    calling agent can understand the tech stack and test infrastructure before
    writing any code.
    """

    name: str = "setup_ai_context"
    description: str = (
        "Create CLAUDE.md and .github/copilot-instructions.md in the worktree "
        "if they do not already exist. Call this once after create_git_branch. "
        "Returns the full project context — READ IT carefully before implementing "
        "anything. It tells you the tech stack, Docker services, and how to run tests."
    )
    args_schema: Type[BaseModel] = SetupAiContextInput
    repo_path: str = ""
    task_id: str = ""

    def _run(self, branch_name: str = "") -> str:
        progress.set_step(self.task_id, "Reading project context...")
        repo = self.repo_path or settings.repo_path
        root = _worktree_path(repo, branch_name) if branch_name else repo

        if not os.path.isdir(root):
            return f"Skipped: worktree '{root}' does not exist yet."

        ctx = _gather_repo_context(root)
        created: list[str] = []
        skipped: list[str] = []

        # --- CLAUDE.md ---
        claude_path = os.path.join(root, "CLAUDE.md")
        claude_content = _build_claude_md(ctx)
        if os.path.isfile(claude_path):
            skipped.append("CLAUDE.md")
            # Read existing CLAUDE.md so the agent gets the real project context
            claude_content = _read_limited(claude_path, 6000)
        else:
            Path(claude_path).write_text(claude_content, encoding="utf-8")
            created.append("CLAUDE.md")

        # --- .github/copilot-instructions.md ---
        github_dir = os.path.join(root, ".github")
        os.makedirs(github_dir, exist_ok=True)
        copilot_path = os.path.join(github_dir, "copilot-instructions.md")
        if os.path.isfile(copilot_path):
            skipped.append(".github/copilot-instructions.md")
        else:
            Path(copilot_path).write_text(_build_copilot_instructions(ctx), encoding="utf-8")
            created.append(".github/copilot-instructions.md")

        action_summary = ""
        parts: list[str] = []
        if created:
            parts.append("Created: " + ", ".join(created))
        if skipped:
            parts.append("Already exists (skipped): " + ", ".join(skipped))
        action_summary = " | ".join(parts) or "Nothing to do."

        return f"""{action_summary}

=== PROJECT CONTEXT (read before implementing) ===
{claude_content}
==================================================
"""
