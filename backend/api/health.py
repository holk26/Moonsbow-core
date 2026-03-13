import logging
from fastapi import APIRouter
from sqlalchemy import text

from backend.core.database.session import AsyncSessionLocal
from backend.core.config.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health_check():
    db_status = "ok"
    redis_status = "ok"

    # Check database
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_status = "error"

    # Check redis
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        redis_status = "error"

    overall = "ok" if db_status == "ok" and redis_status == "ok" else "degraded"

    return {
        "status": overall,
        "version": "0.1.0",
        "services": {
            "database": db_status,
            "redis": redis_status,
        },
    }
