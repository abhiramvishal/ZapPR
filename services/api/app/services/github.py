from typing import Any, Optional

import httpx

GITHUB_API = "https://api.github.com"


async def get_user(access_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        r.raise_for_status()
        return r.json()


async def list_repos(access_token: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/user/repos",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params={"per_page": 100, "sort": "updated"},
        )
        r.raise_for_status()
        return r.json()


async def get_default_branch(access_token: str, owner: str, repo: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        r.raise_for_status()
        data = r.json()
        return data.get("default_branch", "main")


async def list_branches(access_token: str, owner: str, repo: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/branches",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params={"per_page": 100},
        )
        r.raise_for_status()
        return r.json()


async def get_branch_sha(access_token: str, owner: str, repo: str, branch: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        r.raise_for_status()
        return r.json()["object"]["sha"]


async def create_branch(access_token: str, owner: str, repo: str, name: str, from_sha: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/refs",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            json={"ref": f"refs/heads/{name}", "sha": from_sha},
        )
        r.raise_for_status()
        return r.json()


async def get_tree(access_token: str, owner: str, repo: str, sha: str, depth: int = 4, max_entries: int = 500) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{sha}",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params={"recursive": "1"},
        )
        r.raise_for_status()
        data = r.json()
        tree = data.get("tree", [])
        limited = []
        for entry in tree:
            if len(limited) >= max_entries:
                break
            path = entry.get("path", "")
            parts = path.split("/")
            if len(parts) > depth:
                continue
            limited.append({"path": path, "type": entry.get("type", "blob"), "sha": entry.get("sha")})
        return {"sha": data.get("sha", sha), "tree": limited, "truncated": len(tree) > max_entries}


async def get_file_content(access_token: str, owner: str, repo: str, path: str, ref: Optional[str] = None) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
        params = {"ref": ref} if ref else {}
        r = await client.get(
            url,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params=params,
        )
        r.raise_for_status()
        return r.json()


async def create_or_update_file(
    access_token: str, owner: str, repo: str, path: str, content: str, message: str, branch: str, sha: Optional[str] = None
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "message": message,
        "content": __b64encode(content),
        "branch": branch,
    }
    if sha:
        payload["sha"] = sha
    async with httpx.AsyncClient() as client:
        r = await client.put(
            f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            json=payload,
        )
        r.raise_for_status()
        return r.json()


async def apply_patch_and_commit(
    access_token: str,
    owner: str,
    repo: str,
    branch: str,
    patch_content: str,
    commit_message: str,
) -> str:
    """Apply patch via GitHub API and commit. Returns commit SHA."""
    from app.patch_utils import apply_patch, parse_unified_diff

    patches = parse_unified_diff(patch_content)
    if not patches:
        raise ValueError("Invalid patch")

    last_commit_sha = None
    for fp in patches:
        path = fp.path
        try:
            fc = await get_file_content(access_token, owner, repo, path, branch)
            current_content = __b64decode(fc.get("content", ""))
            current_sha = fc.get("sha")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                current_content = ""
                current_sha = None
            else:
                raise

        result = apply_patch(current_content, fp)
        res = await create_or_update_file(
            access_token, owner, repo, path, result, commit_message, branch, current_sha
        )
        last_commit_sha = res.get("commit", {}).get("sha")

    if not last_commit_sha:
        raise ValueError("No commits created")
    return last_commit_sha


async def create_pr(
    access_token: str,
    owner: str,
    repo: str,
    head: str,
    base: str,
    title: str,
    body: Optional[str] = None,
) -> str:
    """Create PR. Returns PR URL."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            json={
                "title": title,
                "body": body or title,
                "head": head,
                "base": base,
            },
        )
        r.raise_for_status()
        pr = r.json()
        return pr.get("html_url", "")


def __b64encode(s: str) -> str:
    import base64
    return base64.b64encode(s.encode("utf-8")).decode("ascii")


def __b64decode(s: str) -> str:
    import base64
    return base64.b64decode(s).decode("utf-8")
