from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.crud import create_or_update_user, get_user_by_github_id
from app.database import get_db
from app.schemas import CallbackRequest, OAuthStartResponse, TokenResponse
from app.security import create_access_token, generate_pkce_pair

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"


@router.get("/github/start", response_model=OAuthStartResponse)
async def github_oauth_start(redirect_uri: str | None = None):
    """Start GitHub OAuth flow. Returns URL for PKCE and state."""
    code_verifier, code_challenge = generate_pkce_pair()
    import secrets
    state = secrets.token_urlsafe(16)
    uri = redirect_uri or settings.oauth_redirect_uri
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": uri,
        "scope": "repo",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    from urllib.parse import urlencode
    auth_url = f"{GITHUB_AUTH_URL}?{urlencode(params)}"
    return OAuthStartResponse(
        auth_url=auth_url,
        code_verifier=code_verifier,
        state=state,
    )


@router.post("/github/callback", response_model=TokenResponse)
async def github_oauth_callback(
    body: CallbackRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Exchange code for tokens. Returns app JWT."""
    redirect_uri = body.redirect_uri or settings.oauth_redirect_uri

    async with httpx.AsyncClient() as client:
        r = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": body.code,
                "redirect_uri": redirect_uri,
                "code_verifier": body.code_verifier,
            },
        )
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail="OAuth exchange failed")
    data = r.json()
    if "error" in data:
        raise HTTPException(status_code=400, detail=data.get("error_description", data["error"]))
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token in response")

    # Fetch user and store
    from app.services.github import get_user
    gh_user = await get_user(access_token)
    user = await create_or_update_user(
        db,
        github_id=gh_user["id"],
        login=gh_user["login"],
        avatar_url=gh_user.get("avatar_url"),
        access_token=access_token,
    )
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, expires_in=settings.jwt_expiry_minutes * 60)
