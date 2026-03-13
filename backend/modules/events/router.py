import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.modules.events.service import EventService
from backend.modules.events.schemas import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/", response_model=EventResponse, status_code=201)
async def publish_event(
    data: EventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = EventService(db)
    return await service.publish(data)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = EventService(db)
    return await service.get(event_id)


@router.get("/tenant/{tenant_id}", response_model=list[EventResponse])
async def list_tenant_events(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = EventService(db)
    return await service.list_by_tenant(tenant_id=tenant_id, page=page, size=size)
