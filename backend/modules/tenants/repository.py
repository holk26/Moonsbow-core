import uuid
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.tenants.models import Tenant

logger = logging.getLogger(__name__)


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tenant_id: uuid.UUID) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.slug == slug))
        return result.scalar_one_or_none()

    async def list(self, offset: int = 0, limit: int = 20) -> tuple[list[Tenant], int]:
        count_result = await self.db.execute(select(func.count()).select_from(Tenant))
        total = count_result.scalar_one()
        result = await self.db.execute(select(Tenant).offset(offset).limit(limit))
        return list(result.scalars().all()), total

    async def create(self, name: str, slug: str, plan: str = "free", description: str | None = None) -> Tenant:
        tenant = Tenant(name=name, slug=slug, plan=plan, description=description)
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def update(self, tenant: Tenant, **kwargs) -> Tenant:
        for key, value in kwargs.items():
            setattr(tenant, key, value)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def delete(self, tenant: Tenant) -> None:
        await self.db.delete(tenant)
        await self.db.flush()
