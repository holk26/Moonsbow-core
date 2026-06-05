import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.modules.tenants.repository import TenantRepository
from backend.modules.tenants.schemas import TenantCreate, TenantUpdate, TenantResponse

logger = logging.getLogger(__name__)


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TenantRepository(db)

    async def create(self, data: TenantCreate) -> TenantResponse:
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tenant slug already exists")
        tenant = await self.repo.create(
            name=data.name, slug=data.slug, plan=data.plan, description=data.description
        )

        # Dispatch sync webhook so apps can update their local tenant tables
        from backend.core.sync.dispatcher import get_sync_dispatcher
        await get_sync_dispatcher().dispatch(
            event_type="sync.tenant.created",
            payload={
                "id": str(tenant.id),
                "name": tenant.name,
                "slug": tenant.slug,
                "plan": tenant.plan,
                "description": tenant.description,
                "is_active": tenant.is_active,
                "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
            },
            db=self.db,
        )

        return TenantResponse.model_validate(tenant)

    async def get(self, tenant_id: uuid.UUID) -> TenantResponse:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return TenantResponse.model_validate(tenant)

    async def list(self, page: int = 1, size: int = 20) -> dict:
        offset = (page - 1) * size
        items, total = await self.repo.list(offset=offset, limit=size)
        return {
            "items": [TenantResponse.model_validate(t) for t in items],
            "total": total,
            "page": page,
            "size": size,
        }

    async def update(self, tenant_id: uuid.UUID, data: TenantUpdate) -> TenantResponse:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        updates = data.model_dump(exclude_unset=True)
        if "slug" in updates and updates["slug"] != tenant.slug:
            existing = await self.repo.get_by_slug(updates["slug"])
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tenant slug already exists")
        tenant = await self.repo.update(tenant, **updates)

        # Dispatch sync webhook so apps can update their local tenant tables
        from backend.core.sync.dispatcher import get_sync_dispatcher
        await get_sync_dispatcher().dispatch(
            event_type="sync.tenant.updated",
            payload={
                "id": str(tenant.id),
                "name": tenant.name,
                "slug": tenant.slug,
                "plan": tenant.plan,
                "description": tenant.description,
                "is_active": tenant.is_active,
                "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
            },
            db=self.db,
        )

        return TenantResponse.model_validate(tenant)

    async def delete(self, tenant_id: uuid.UUID) -> None:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        await self.repo.delete(tenant)
