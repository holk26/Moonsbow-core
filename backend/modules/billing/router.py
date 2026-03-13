import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.modules.billing.service import BillingService
from backend.modules.billing.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    data: SubscriptionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = BillingService(db)
    return await service.create_subscription(data)


@router.get("/subscriptions/{sub_id}", response_model=SubscriptionResponse)
async def get_subscription(
    sub_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = BillingService(db)
    return await service.get_subscription(sub_id)


@router.get("/tenants/{tenant_id}/subscriptions", response_model=list[SubscriptionResponse])
async def get_tenant_subscriptions(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = BillingService(db)
    return await service.get_tenant_subscriptions(tenant_id)


@router.put("/subscriptions/{sub_id}", response_model=SubscriptionResponse)
async def update_subscription(
    sub_id: uuid.UUID,
    data: SubscriptionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = BillingService(db)
    return await service.update_subscription(sub_id, data)
