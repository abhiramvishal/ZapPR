from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.security import decrypt_token, encrypt_token


async def get_user_by_github_id(db: AsyncSession, github_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.github_id == github_id))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_or_update_user(
    db: AsyncSession,
    github_id: int,
    login: str,
    avatar_url: Optional[str] = None,
    access_token: Optional[str] = None,
) -> User:
    user = await get_user_by_github_id(db, github_id)
    if user:
        user.login = login
        user.avatar_url = avatar_url
        if access_token:
            user.encrypted_token = encrypt_token(access_token)
        await db.flush()
        return user

    user = User(
        github_id=github_id,
        login=login,
        avatar_url=avatar_url,
        encrypted_token=encrypt_token(access_token) if access_token else None,
    )
    db.add(user)
    await db.flush()
    return user


def get_github_token(user: User) -> Optional[str]:
    if not user.encrypted_token:
        return None
    return decrypt_token(user.encrypted_token)
