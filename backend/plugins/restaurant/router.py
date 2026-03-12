import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.plugins.restaurant.service import RestaurantService
from backend.plugins.restaurant.schemas import MenuItemCreate, MenuItemUpdate, MenuItemResponse, OrderCreate, OrderResponse

router = APIRouter(prefix="/restaurant", tags=["restaurant"])


@router.post("/menu", response_model=MenuItemResponse, status_code=201)
async def create_menu_item(
    data: MenuItemCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    return await service.create_menu_item(data)


@router.get("/menu/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    return await service.get_menu_item(item_id)


@router.get("/tenant/{tenant_id}/menu", response_model=list[MenuItemResponse])
async def list_menu(
    tenant_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = RestaurantService(db)
    return await service.list_menu(tenant_id=tenant_id, page=page, size=size)


@router.put("/menu/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: uuid.UUID,
    data: MenuItemUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    return await service.update_menu_item(item_id, data)


@router.delete("/menu/{item_id}", status_code=204)
async def delete_menu_item(
    item_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    await service.delete_menu_item(item_id)


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def place_order(
    data: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    return await service.place_order(data)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = RestaurantService(db)
    return await service.get_order(order_id)
