import logging
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/")
async def get_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    """Return dashboard statistics."""
    stats = {
        "users": 0,
        "tenants": 0,
        "apps": 0,
        "subscriptions": 0,
        "notifications": 0,
        "events": 0,
    }

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM users"))
        stats["users"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count users: {e}")

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM tenants"))
        stats["tenants"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count tenants: {e}")

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM apps"))
        stats["apps"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count apps: {e}")

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM subscriptions"))
        stats["subscriptions"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count subscriptions: {e}")

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM notifications"))
        stats["notifications"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count notifications: {e}")

    try:
        result = await db.execute(text("SELECT COUNT(*) FROM platform_events"))
        stats["events"] = result.scalar_one()
    except Exception as e:
        logger.warning(f"Failed to count events: {e}")

    return stats
