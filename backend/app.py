import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config.settings import get_settings
from backend.core.config.logging import configure_logging
from backend.core.database.session import init_db
from backend.api.router import api_router

settings = get_settings()
logger = logging.getLogger(__name__)

_STARTUP_CHECK_TIMEOUT = 5  # seconds per check


async def _check_database() -> bool:
    """Return True if the database connection is healthy."""
    try:
        from sqlalchemy import text
        from backend.core.database.session import AsyncSessionLocal

        async def _probe():
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))

        await asyncio.wait_for(_probe(), timeout=_STARTUP_CHECK_TIMEOUT)
        return True
    except asyncio.TimeoutError:
        logger.critical("Startup database check timed out after %ss", _STARTUP_CHECK_TIMEOUT)
        return False
    except Exception as exc:
        logger.error("Startup database check failed: %s", exc)
        return False


async def _check_redis() -> bool:
    """Return True if the Redis connection is healthy."""
    try:
        import redis.asyncio as aioredis

        async def _probe():
            r = aioredis.from_url(
                settings.REDIS_URL, socket_connect_timeout=_STARTUP_CHECK_TIMEOUT
            )
            try:
                await r.ping()
            finally:
                await r.aclose()

        await asyncio.wait_for(_probe(), timeout=_STARTUP_CHECK_TIMEOUT + 2)
        return True
    except asyncio.TimeoutError:
        logger.critical("Startup Redis check timed out after %ss", _STARTUP_CHECK_TIMEOUT)
        return False
    except Exception as exc:
        logger.error("Startup Redis check failed: %s", exc)
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    await init_db()

    db_ok = await _check_database()
    redis_ok = await _check_redis()

    if not db_ok:
        logger.critical(
            "DATABASE is not reachable at startup. "
            "Check DATABASE_URL and ensure PostgreSQL is running and accessible."
        )
    if not redis_ok:
        logger.warning(
            "REDIS is not reachable at startup. "
            "Background tasks (Celery) will fail; the API will still serve requests."
        )
    if db_ok and redis_ok:
        logger.info("Startup connection checks passed: database=ok, redis=ok")
    elif db_ok:
        logger.info("Startup connection checks: database=ok, redis=unavailable (non-fatal)")

    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Moonsbow Core Backend API",
        lifespan=lifespan,
        docs_url="/docs" if settings.APP_DEBUG else None,
        redoc_url="/redoc" if settings.APP_DEBUG else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app
