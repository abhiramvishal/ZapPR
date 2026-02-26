import time
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user
from app.models import User
from app.schemas import AgentPatchRequest, AgentPatchResponse
from app.services.agent import generate_patch
from app.services.github import get_branch_sha, get_file_content, get_tree
from app.crud import get_github_token

router = APIRouter(prefix="/agent", tags=["agent"])

# Simple rate limit: 10 req/min per user
_agent_requests: dict[int, list[float]] = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60


def _format_tree(tree: list[dict]) -> str:
    lines = []
    for e in tree:
        prefix = "  " * (e["path"].count("/"))
        icon = "📁" if e["type"] == "tree" else "📄"
        lines.append(f"{prefix}{icon} {e['path']}")
    return "\n".join(lines) if lines else "(empty)"


@router.post("/patch", response_model=AgentPatchResponse)
async def agent_patch(
    body: AgentPatchRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    """Generate patch via Claude. Claude key is passed per-request, never stored."""
    now = time.time()
    _agent_requests[user.id] = [t for t in _agent_requests[user.id] if t > now - RATE_WINDOW]
    if len(_agent_requests[user.id]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    _agent_requests[user.id].append(now)

    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")

    # Fetch repo map
    sha = await get_branch_sha(token, body.owner, body.repo, body.branch)
    tree_data = await get_tree(token, body.owner, body.repo, sha)
    repo_map = _format_tree(tree_data["tree"])

    # Fetch selected file contents
    selected_files: dict[str, str] = {}
    for path in body.selected_files[:20]:  # Limit
        try:
            fc = await get_file_content(token, body.owner, body.repo, path, body.branch)
            import base64
            content = base64.b64decode(fc.get("content", "")).decode("utf-8", errors="replace")
            selected_files[path] = content
        except Exception:
            pass  # Skip files we can't fetch

    try:
        result = await generate_patch(
            api_key=body.claude_api_key,
            repo_map=repo_map,
            selected_files=selected_files,
            user_goal=body.user_goal,
            extra_instructions=body.extra_instructions,
        )
        return AgentPatchResponse(
            plan=result["plan"],
            patch=result["patch"],
            summary=result["summary"],
            files_changed=result["files_changed"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
