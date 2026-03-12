import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.modules.notifications.service import NotificationService
from backend.modules.notifications.schemas import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/", response_model=NotificationResponse, status_code=201)
async def send_notification(
    data: NotificationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = NotificationService(db)
    return await service.send(data)


@router.get("/{notif_id}", response_model=NotificationResponse)
async def get_notification(
    notif_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = NotificationService(db)
    return await service.get(notif_id)


@router.get("/user/{user_id}/tenant/{tenant_id}", response_model=list[NotificationResponse])
async def list_user_notifications(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = NotificationService(db)
    return await service.list_for_user(user_id=user_id, tenant_id=tenant_id, page=page, size=size)


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notif_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = NotificationService(db)
    return await service.mark_read(notif_id)
