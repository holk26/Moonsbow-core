import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.apps.models import App


class AppRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> App:
        app = App(**kwargs)
        self.db.add(app)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def get_by_id(self, app_id: uuid.UUID) -> App | None:
        result = await self.db.execute(select(App).where(App.id == app_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> App | None:
        result = await self.db.execute(select(App).where(App.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> App | None:
        result = await self.db.execute(select(App).where(App.api_key == api_key))
        return result.scalar_one_or_none()

    async def list_all(self, page: int = 1, size: int = 20):
        offset = (page - 1) * size
        result = await self.db.execute(select(App).offset(offset).limit(size))
        return result.scalars().all()

    async def update(self, app: App, **kwargs) -> App:
        for key, value in kwargs.items():
            if value is not None:
                setattr(app, key, value)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def delete(self, app: App) -> None:
        await self.db.delete(app)

    async def get_active_apps(self) -> list[App]:
        result = await self.db.execute(select(App).where(App.is_active == True))
        return result.scalars().all()
