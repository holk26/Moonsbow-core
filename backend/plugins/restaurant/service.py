import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.plugins.restaurant.repository import MenuItemRepository, OrderRepository
from backend.plugins.restaurant.schemas import MenuItemCreate, MenuItemUpdate, MenuItemResponse, OrderCreate, OrderResponse

logger = logging.getLogger(__name__)


class RestaurantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.menu_repo = MenuItemRepository(db)
        self.order_repo = OrderRepository(db)

    async def create_menu_item(self, data: MenuItemCreate) -> MenuItemResponse:
        item = await self.menu_repo.create(data.model_dump())
        return MenuItemResponse.model_validate(item)

    async def get_menu_item(self, item_id: uuid.UUID) -> MenuItemResponse:
        item = await self.menu_repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        return MenuItemResponse.model_validate(item)

    async def list_menu(self, tenant_id: uuid.UUID, page: int = 1, size: int = 20) -> list[MenuItemResponse]:
        offset = (page - 1) * size
        items = await self.menu_repo.list_by_tenant(tenant_id=tenant_id, offset=offset, limit=size)
        return [MenuItemResponse.model_validate(i) for i in items]

    async def update_menu_item(self, item_id: uuid.UUID, data: MenuItemUpdate) -> MenuItemResponse:
        item = await self.menu_repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        updates = data.model_dump(exclude_unset=True)
        item = await self.menu_repo.update(item, **updates)
        return MenuItemResponse.model_validate(item)

    async def delete_menu_item(self, item_id: uuid.UUID) -> None:
        item = await self.menu_repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        await self.menu_repo.delete(item)

    async def place_order(self, data: OrderCreate) -> OrderResponse:
        order = await self.order_repo.create(data.model_dump())
        return OrderResponse.model_validate(order)

    async def get_order(self, order_id: uuid.UUID) -> OrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse.model_validate(order)
