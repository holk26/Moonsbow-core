import logging
from typing import Annotated
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.modules.apps.repository import AppRepository

logger = logging.getLogger(__name__)


async def get_current_app(
    x_api_key: Annotated[str, Header(..., alias="X-API-Key")],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Dependency to authenticate requests from registered apps via API Key."""
    repo = AppRepository(db)
    app = await repo.get_by_api_key(x_api_key)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    if not app.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="App is inactive",
        )
    return app
