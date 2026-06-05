import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.modules.billing.repository import SubscriptionRepository
from backend.modules.billing.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse

logger = logging.getLogger(__name__)


class BillingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SubscriptionRepository(db)

    async def create_subscription(self, data: SubscriptionCreate) -> SubscriptionResponse:
        sub = await self.repo.create(data.model_dump())

        # Dispatch sync webhook so apps can update their local subscription tables
        from backend.core.sync.dispatcher import get_sync_dispatcher
        await get_sync_dispatcher().dispatch(
            event_type="sync.subscription.created",
            payload={
                "id": str(sub.id),
                "tenant_id": str(sub.tenant_id),
                "plan": sub.plan,
                "status": sub.status,
                "started_at": sub.started_at.isoformat() if sub.started_at else None,
                "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
                "created_at": sub.created_at.isoformat() if sub.created_at else None,
            },
            db=self.db,
        )

        return SubscriptionResponse.model_validate(sub)

    async def get_subscription(self, sub_id: uuid.UUID) -> SubscriptionResponse:
        sub = await self.repo.get_by_id(sub_id)
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        return SubscriptionResponse.model_validate(sub)

    async def get_tenant_subscriptions(self, tenant_id: uuid.UUID) -> list[SubscriptionResponse]:
        subs = await self.repo.get_by_tenant(tenant_id)
        return [SubscriptionResponse.model_validate(s) for s in subs]

    async def update_subscription(self, sub_id: uuid.UUID, data: SubscriptionUpdate) -> SubscriptionResponse:
        sub = await self.repo.get_by_id(sub_id)
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        updates = data.model_dump(exclude_unset=True)
        sub = await self.repo.update(sub, **updates)

        # Dispatch sync webhook so apps can update their local subscription tables
        from backend.core.sync.dispatcher import get_sync_dispatcher
        await get_sync_dispatcher().dispatch(
            event_type="sync.subscription.updated",
            payload={
                "id": str(sub.id),
                "tenant_id": str(sub.tenant_id),
                "plan": sub.plan,
                "status": sub.status,
                "started_at": sub.started_at.isoformat() if sub.started_at else None,
                "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
                "updated_at": sub.updated_at.isoformat() if sub.updated_at else None,
            },
            db=self.db,
        )

        return SubscriptionResponse.model_validate(sub)
