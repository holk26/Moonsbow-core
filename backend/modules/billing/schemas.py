import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubscriptionCreate(BaseModel):
    tenant_id: uuid.UUID
    plan: str
    status: str = "active"
    started_at: datetime | None = None
    expires_at: datetime | None = None
    external_id: str | None = None


class SubscriptionUpdate(BaseModel):
    plan: str | None = None
    status: str | None = None
    expires_at: datetime | None = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    plan: str
    status: str
    started_at: datetime | None
    expires_at: datetime | None
    external_id: str | None
