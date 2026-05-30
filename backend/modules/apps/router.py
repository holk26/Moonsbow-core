import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.modules.apps.service import AppService
from backend.modules.apps.schemas import AppCreate, AppUpdate, AppResponse

router = APIRouter(prefix="/apps", tags=["apps"])


@router.post("/", response_model=AppResponse, status_code=201)
async def create_app(
    data: AppCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.create(data)


@router.get("/", response_model=list[AppResponse])
async def list_apps(
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = AppService(db)
    return await service.list(page=page, size=size)


@router.get("/{app_id}", response_model=AppResponse)
async def get_app(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.get(app_id)


@router.put("/{app_id}", response_model=AppResponse)
async def update_app(
    app_id: uuid.UUID,
    data: AppUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.update(app_id, data)


@router.delete("/{app_id}", status_code=204)
async def delete_app(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    await service.delete(app_id)


@router.post("/{app_id}/rotate-key", response_model=AppResponse)
async def rotate_app_key(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.rotate_key(app_id)
