from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.crud import get_github_token
from app.deps import get_current_user
from app.models import User
from app.schemas import ApplyCommitRequest, ApplyCommitResponse, CreatePRRequest, CreatePRResponse
from app.services.github import apply_patch_and_commit, create_pr, get_default_branch
from app.services.patch_validator import validate_patch

router = APIRouter(prefix="/git", tags=["git"])


@router.post("/apply-and-commit", response_model=ApplyCommitResponse)
async def apply_and_commit(
    body: ApplyCommitRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    """Validate patch, apply via GitHub API, commit. Returns commit SHA."""
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")

    valid, msg, _ = validate_patch(body.patch)
    if not valid:
        raise HTTPException(status_code=400, detail=msg or "Patch validation failed")

    try:
        commit_sha = await apply_patch_and_commit(
            access_token=token,
            owner=body.owner,
            repo=body.repo,
            branch=body.branch,
            patch_content=body.patch,
            commit_message=body.commit_message,
        )
        return ApplyCommitResponse(commit_sha=commit_sha, branch=body.branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pr", response_model=CreatePRResponse)
async def create_pr_endpoint(
    body: CreatePRRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    """Create PR from branch to base. Returns PR URL."""
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")

    base = body.base
    if not base:
        base = await get_default_branch(token, body.owner, body.repo)

    try:
        pr_url = await create_pr(
            access_token=token,
            owner=body.owner,
            repo=body.repo,
            head=body.head,
            base=base,
            title=body.title,
            body=body.body,
        )
        # Extract PR number from URL (e.g. .../pull/123)
        pr_number = int(pr_url.rstrip("/").split("/")[-1]) if pr_url else 0
        return CreatePRResponse(pr_url=pr_url, pr_number=pr_number)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
