import uuid
import secrets
import hmac
import hashlib
import json
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.webhooks.repository import WebhookRepository
from backend.modules.webhooks.schemas import WebhookCreate, WebhookResponse


class WebhookService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WebhookRepository(db)

    def _generate_secret(self) -> str:
        return secrets.token_urlsafe(32)

    def _sign_payload(self, payload: str, secret: str) -> str:
        return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

    async def create(self, app_id: uuid.UUID, data: WebhookCreate) -> WebhookResponse:
        sub = await self.repo.create(
            app_id=app_id,
            event_types=data.event_types,
            url=data.url,
            secret=self._generate_secret(),
        )
        return WebhookResponse.model_validate(sub)

    async def get(self, sub_id: uuid.UUID, app_id: uuid.UUID) -> WebhookResponse:
        sub = await self.repo.get_by_id(sub_id)
        if not sub or sub.app_id != app_id:
            raise HTTPException(status_code=404, detail="Webhook not found")
        return WebhookResponse.model_validate(sub)

    async def list_by_app(self, app_id: uuid.UUID) -> list[WebhookResponse]:
        subs = await self.repo.list_by_app(app_id)
        return [WebhookResponse.model_validate(s) for s in subs]

    async def delete(self, sub_id: uuid.UUID, app_id: uuid.UUID) -> None:
        sub = await self.repo.get_by_id(sub_id)
        if not sub or sub.app_id != app_id:
            raise HTTPException(status_code=404, detail="Webhook not found")
        await self.repo.delete(sub)

    async def get_active_subscriptions(self, event_type: str):
        return await self.repo.list_active_by_event(event_type)

    def build_payload(self, event_id: str, event_type: str, app_id: uuid.UUID, data: dict) -> str:
        import datetime
        payload = {
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "app_id": str(app_id),
            "data": data,
        }
        return json.dumps(payload, default=str)
