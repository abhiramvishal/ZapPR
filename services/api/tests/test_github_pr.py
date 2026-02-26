"""Happy path test for PR creation (mocked)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.github import create_pr


@pytest.mark.asyncio
async def test_create_pr_mocked():
    """Test create_pr returns URL when GitHub API succeeds."""
    mock_post = AsyncMock()
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"html_url": "https://github.com/owner/repo/pull/1"}
    mock_post.return_value = mock_response

    mock_client = MagicMock()
    mock_client.post = mock_post
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("httpx.AsyncClient", return_value=mock_client):
        url = await create_pr(
            access_token="token",
            owner="owner",
            repo="repo",
            head="feature",
            base="main",
            title="Test PR",
            body="Description",
        )
        assert url == "https://github.com/owner/repo/pull/1"
