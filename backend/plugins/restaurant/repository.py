import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plugins.restaurant.models import MenuItem, Order

logger = logging.getLogger(__name__)


class MenuItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, item_id: uuid.UUID) -> MenuItem | None:
        result = await self.db.execute(select(MenuItem).where(MenuItem.id == item_id))
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[MenuItem]:
        result = await self.db.execute(
            select(MenuItem).where(MenuItem.tenant_id == tenant_id).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> MenuItem:
        item = MenuItem(**data)
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def update(self, item: MenuItem, **kwargs) -> MenuItem:
        for key, value in kwargs.items():
            setattr(item, key, value)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete(self, item: MenuItem) -> None:
        await self.db.delete(item)
        await self.db.flush()


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Order:
        order = Order(**data)
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def get_by_id(self, order_id: uuid.UUID) -> Order | None:
        result = await self.db.execute(select(Order).where(Order.id == order_id))
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Order]:
        result = await self.db.execute(
            select(Order).where(Order.tenant_id == tenant_id).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, order: Order, **kwargs) -> Order:
        for key, value in kwargs.items():
            setattr(order, key, value)
        await self.db.flush()
        await self.db.refresh(order)
        return order
