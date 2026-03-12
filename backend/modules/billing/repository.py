import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.billing.models import Subscription

logger = logging.getLogger(__name__)


class SubscriptionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, sub_id: uuid.UUID) -> Subscription | None:
        result = await self.db.execute(select(Subscription).where(Subscription.id == sub_id))
        return result.scalar_one_or_none()

    async def get_by_tenant(self, tenant_id: uuid.UUID) -> list[Subscription]:
        result = await self.db.execute(
            select(Subscription).where(Subscription.tenant_id == tenant_id)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> Subscription:
        sub = Subscription(**data)
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def update(self, sub: Subscription, **kwargs) -> Subscription:
        for key, value in kwargs.items():
            setattr(sub, key, value)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub
