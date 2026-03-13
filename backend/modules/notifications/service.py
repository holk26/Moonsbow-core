import uuid
import logging
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.modules.notifications.repository import NotificationRepository
from backend.modules.notifications.schemas import NotificationCreate, NotificationResponse

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def send(self, data: NotificationCreate) -> NotificationResponse:
        notif_data = data.model_dump()
        notif_data["sent_at"] = datetime.now(timezone.utc)
        notif = await self.repo.create(notif_data)
        return NotificationResponse.model_validate(notif)

    async def get(self, notif_id: uuid.UUID) -> NotificationResponse:
        notif = await self.repo.get_by_id(notif_id)
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        return NotificationResponse.model_validate(notif)

    async def list_for_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID, page: int = 1, size: int = 20) -> list[NotificationResponse]:
        offset = (page - 1) * size
        items = await self.repo.list_by_user(user_id=user_id, tenant_id=tenant_id, offset=offset, limit=size)
        return [NotificationResponse.model_validate(n) for n in items]

    async def mark_read(self, notif_id: uuid.UUID) -> NotificationResponse:
        notif = await self.repo.get_by_id(notif_id)
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        notif = await self.repo.mark_read(notif)
        return NotificationResponse.model_validate(notif)
