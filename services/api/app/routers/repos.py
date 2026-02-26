from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import get_github_token
from app.deps import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import BranchItem, CreateBranchRequest, FileContentResponse, RepoItem, TreeEntry, TreeResponse
from app.services.github import (
    create_branch,
    get_branch_sha,
    get_default_branch,
    get_file_content,
    get_tree,
    list_branches,
    list_repos,
)

router = APIRouter(tags=["repos"])


@router.get("/me")
async def get_me(user: Annotated[User, Depends(get_current_user)]):
    return {"id": user.id, "login": user.login, "avatar_url": user.avatar_url}


@router.get("/repos", response_model=list[RepoItem])
async def get_repos(user: Annotated[User, Depends(get_current_user)]):
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    repos = await list_repos(token)
    return [
        RepoItem(
            id=r["id"],
            name=r["name"],
            full_name=r["full_name"],
            private=r["private"],
            default_branch=r.get("default_branch", "main"),
            owner=r.get("owner", {}),
        )
        for r in repos
    ]


@router.get("/repos/{owner}/{repo}/branches", response_model=list[BranchItem])
async def get_branches(
    owner: str,
    repo: str,
    user: Annotated[User, Depends(get_current_user)],
):
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    branches = await list_branches(token, owner, repo)
    return [BranchItem(name=b["name"], sha=b["commit"]["sha"]) for b in branches]


@router.post("/repos/{owner}/{repo}/branches")
async def create_branch_endpoint(
    owner: str,
    repo: str,
    body: CreateBranchRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    from_ref = body.from_ref
    if from_ref == "HEAD":
        from_ref = await get_default_branch(token, owner, repo)
        from_sha = await get_branch_sha(token, owner, repo, from_ref)
    else:
        from_sha = await get_branch_sha(token, owner, repo, from_ref)
    result = await create_branch(token, owner, repo, body.name, from_sha)
    return {"ref": result["ref"], "sha": result["object"]["sha"]}


@router.get("/repos/{owner}/{repo}/tree", response_model=TreeResponse)
async def get_repo_tree(
    owner: str,
    repo: str,
    ref: str | None = None,
    user: Annotated[User, Depends(get_current_user)] = None,
):
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    if not ref:
        ref = await get_default_branch(token, owner, repo)
    sha = await get_branch_sha(token, owner, repo, ref)
    data = await get_tree(token, owner, repo, sha)
    return TreeResponse(
        sha=data["sha"],
        tree=[TreeEntry(path=e["path"], type=e["type"], sha=e.get("sha")) for e in data["tree"]],
        truncated=data.get("truncated", False),
    )


@router.get("/repos/{owner}/{repo}/file", response_model=FileContentResponse)
async def get_file(
    owner: str,
    repo: str,
    path: str,
    ref: str | None = None,
    user: Annotated[User, Depends(get_current_user)] = None,
):
    token = get_github_token(user)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub token not found")
    fc = await get_file_content(token, owner, repo, path, ref)
    import base64
    content = base64.b64decode(fc.get("content", "")).decode("utf-8", errors="replace")
    return FileContentResponse(content=content, path=fc.get("path", path))
