"""
Initialize default admin user if DEFAULT_ADMIN_EMAIL is set.
This script runs on container startup before the API server starts.
"""
import asyncio
import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.modules.auth.models import User
from backend.core.security.password import hash_password

logger = logging.getLogger(__name__)

DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "")
DEFAULT_ADMIN_FULL_NAME = os.getenv("DEFAULT_ADMIN_FULL_NAME", "Admin User")
DATABASE_URL = os.getenv("DATABASE_URL", "")


async def init_default_user():
    if not DEFAULT_ADMIN_EMAIL or not DEFAULT_ADMIN_PASSWORD:
        logger.info("DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set, skipping default user creation")
        return
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set, cannot create default user")
        return
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if user already exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
        existing = result.scalar_one_or_none()
        
        if existing:
            logger.info(f"Default admin user {DEFAULT_ADMIN_EMAIL} already exists")
            return
        
        # Create default admin user
        password_hash = hash_password(DEFAULT_ADMIN_PASSWORD)
        user = User(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=password_hash,
            full_name=DEFAULT_ADMIN_FULL_NAME,
            is_active=True,
            is_superuser=True,
        )
        session.add(user)
        await session.commit()
        logger.info(f"Created default admin user: {DEFAULT_ADMIN_EMAIL}")
    
    await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(init_default_user())
