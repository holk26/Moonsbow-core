import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.core.security.api_key import get_current_app
from backend.modules.webhooks.service import WebhookService
from backend.modules.webhooks.schemas import WebhookCreate, WebhookResponse
from backend.modules.apps.models import App

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    data: WebhookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.create(app.id, data)


@router.get("/", response_model=list[WebhookResponse])
async def list_webhooks(
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.list_by_app(app.id)


@router.get("/{sub_id}", response_model=WebhookResponse)
async def get_webhook(
    sub_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.get(sub_id, app.id)


@router.delete("/{sub_id}", status_code=204)
async def delete_webhook(
    sub_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    await service.delete(sub_id, app.id)
