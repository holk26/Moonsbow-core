import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Notification:
        notif = Notification(**data)
        self.db.add(notif)
        await self.db.flush()
        await self.db.refresh(notif)
        return notif

    async def get_by_id(self, notif_id: uuid.UUID) -> Notification | None:
        result = await self.db.execute(select(Notification).where(Notification.id == notif_id))
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.tenant_id == tenant_id)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_read(self, notif: Notification) -> Notification:
        notif.is_read = True
        await self.db.flush()
        await self.db.refresh(notif)
        return notif
