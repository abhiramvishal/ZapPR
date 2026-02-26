from typing import Any, Optional

from pydantic import BaseModel, Field


# Auth
class OAuthStartResponse(BaseModel):
    auth_url: str
    code_verifier: str
    state: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CallbackRequest(BaseModel):
    code: str
    code_verifier: str
    state: str
    redirect_uri: Optional[str] = None


# User
class UserResponse(BaseModel):
    id: int
    login: str
    avatar_url: Optional[str] = None


# Repos
class RepoItem(BaseModel):
    id: int
    name: str
    full_name: str
    private: bool
    default_branch: str
    owner: dict[str, Any]


class BranchItem(BaseModel):
    name: str
    sha: str


class CreateBranchRequest(BaseModel):
    name: str
    from_ref: str = "HEAD"


class TreeEntry(BaseModel):
    path: str
    type: str  # "blob" or "tree"
    sha: Optional[str] = None


class TreeResponse(BaseModel):
    sha: str
    tree: list[TreeEntry]
    truncated: bool = False


class FileContentResponse(BaseModel):
    content: str
    encoding: str = "base64"
    path: str


# Agent
class AgentPatchRequest(BaseModel):
    owner: str
    repo: str
    branch: str
    user_goal: str = Field(..., max_length=2000)
    selected_files: list[str] = Field(default_factory=list, max_length=50)
    extra_instructions: Optional[str] = Field(None, max_length=500)
    claude_api_key: str = Field(..., min_length=1)


class AgentPatchResponse(BaseModel):
    plan: list[str]
    patch: str
    summary: str
    files_changed: list[str]


# Patch validation
class ValidatePatchRequest(BaseModel):
    owner: str
    repo: str
    branch: str
    patch: str = Field(..., max_length=100_000)


class FileChange(BaseModel):
    path: str
    additions: int
    deletions: int
    hunks: list[dict[str, Any]]


class ValidatePatchResponse(BaseModel):
    valid: bool
    message: Optional[str] = None
    file_changes: list[FileChange] = Field(default_factory=list)


# Git operations
class ApplyCommitRequest(BaseModel):
    owner: str
    repo: str
    branch: str
    patch: str = Field(..., max_length=100_000)
    commit_message: str = Field(..., max_length=500)


class ApplyCommitResponse(BaseModel):
    commit_sha: str
    branch: str


class CreatePRRequest(BaseModel):
    owner: str
    repo: str
    head: str  # branch name
    base: Optional[str] = None  # default branch if not set
    title: str = Field(..., max_length=200)
    body: Optional[str] = Field(None, max_length=5000)


class CreatePRResponse(BaseModel):
    pr_url: str
    pr_number: int
