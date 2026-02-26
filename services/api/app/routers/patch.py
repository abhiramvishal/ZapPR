from typing import Annotated

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.schemas import FileChange, ValidatePatchRequest, ValidatePatchResponse
from app.services.patch_validator import validate_patch

router = APIRouter(prefix="/patch", tags=["patch"])


@router.post("/validate", response_model=ValidatePatchResponse)
async def validate_patch_endpoint(
    body: ValidatePatchRequest,
    user: Annotated[User, Depends(get_current_user)] = None,
):
    """Validate patch: apply check, limits, blocked paths, secrets scan."""
    valid, message, file_changes = validate_patch(body.patch)
    return ValidatePatchResponse(
        valid=valid,
        message=message,
        file_changes=[FileChange(path=fc["path"], additions=fc["additions"], deletions=fc["deletions"], hunks=fc["hunks"]) for fc in file_changes],
    )
