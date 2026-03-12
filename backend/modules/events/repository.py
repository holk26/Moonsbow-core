import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.events.models import PlatformEvent

logger = logging.getLogger(__name__)


class EventRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> PlatformEvent:
        event = PlatformEvent(**data)
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def get_by_id(self, event_id: uuid.UUID) -> PlatformEvent | None:
        result = await self.db.execute(select(PlatformEvent).where(PlatformEvent.id == event_id))
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[PlatformEvent]:
        result = await self.db.execute(
            select(PlatformEvent)
            .where(PlatformEvent.tenant_id == tenant_id)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
