import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.core.config.settings import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    from backend.core.database.base import Base  # noqa: F401
    # Import all models to ensure they are registered
    import backend.modules.auth.models  # noqa: F401
    import backend.modules.tenants.models  # noqa: F401
    import backend.modules.billing.models  # noqa: F401
    import backend.modules.events.models  # noqa: F401
    import backend.modules.notifications.models  # noqa: F401
    import backend.modules.apps.models  # noqa: F401
    import backend.modules.webhooks.models  # noqa: F401

    logger.info("Database initialized")
