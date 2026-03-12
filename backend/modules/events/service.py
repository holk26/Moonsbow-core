import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.modules.events.repository import EventRepository
from backend.modules.events.schemas import EventCreate, EventResponse

logger = logging.getLogger(__name__)


class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = EventRepository(db)

    async def publish(self, data: EventCreate) -> EventResponse:
        event = await self.repo.create(data.model_dump())
        return EventResponse.model_validate(event)

    async def get(self, event_id: uuid.UUID) -> EventResponse:
        event = await self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return EventResponse.model_validate(event)

    async def list_by_tenant(self, tenant_id: uuid.UUID, page: int = 1, size: int = 20) -> list[EventResponse]:
        offset = (page - 1) * size
        events = await self.repo.list_by_tenant(tenant_id=tenant_id, offset=offset, limit=size)
        return [EventResponse.model_validate(e) for e in events]
