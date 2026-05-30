import uuid
import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.apps.repository import AppRepository
from backend.modules.apps.schemas import AppCreate, AppUpdate, AppResponse


class AppService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppRepository(db)

    def _generate_api_key(self) -> str:
        return f"mb_{secrets.token_urlsafe(32)}"

    async def create(self, data: AppCreate) -> AppResponse:
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="App with this slug already exists",
            )
        app = await self.repo.create(
            name=data.name,
            slug=data.slug,
            description=data.description,
            webhook_url=data.webhook_url,
            api_key=self._generate_api_key(),
        )
        return AppResponse.model_validate(app)

    async def get(self, app_id: uuid.UUID) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        return AppResponse.model_validate(app)

    async def list(self, page: int = 1, size: int = 20):
        apps = await self.repo.list_all(page=page, size=size)
        return [AppResponse.model_validate(a) for a in apps]

    async def update(self, app_id: uuid.UUID, data: AppUpdate) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        app = await self.repo.update(
            app,
            name=data.name,
            description=data.description,
            webhook_url=data.webhook_url,
            is_active=data.is_active,
        )
        return AppResponse.model_validate(app)

    async def delete(self, app_id: uuid.UUID) -> None:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        await self.repo.delete(app)

    async def rotate_key(self, app_id: uuid.UUID) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        app = await self.repo.update(app, api_key=self._generate_api_key())
        return AppResponse.model_validate(app)
