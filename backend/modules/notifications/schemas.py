import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    tenant_id: uuid.UUID
    user_id: uuid.UUID | None = None
    type: str  # email, sms, push
    subject: str | None = None
    content: str


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID | None
    type: str
    subject: str | None
    content: str
    is_read: bool
    sent_at: datetime | None
