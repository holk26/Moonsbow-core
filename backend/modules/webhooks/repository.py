import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.webhooks.models import WebhookSubscription


class WebhookRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> WebhookSubscription:
        sub = WebhookSubscription(**kwargs)
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_by_id(self, sub_id: uuid.UUID) -> WebhookSubscription | None:
        result = await self.db.execute(select(WebhookSubscription).where(WebhookSubscription.id == sub_id))
        return result.scalar_one_or_none()

    async def list_by_app(self, app_id: uuid.UUID):
        result = await self.db.execute(
            select(WebhookSubscription).where(WebhookSubscription.app_id == app_id)
        )
        return result.scalars().all()

    async def list_active_by_event(self, event_type: str):
        result = await self.db.execute(
            select(WebhookSubscription).where(
                WebhookSubscription.is_active == True,
                WebhookSubscription.event_types.contains([event_type]),
            )
        )
        return result.scalars().all()

    async def delete(self, sub: WebhookSubscription) -> None:
        await self.db.delete(sub)
