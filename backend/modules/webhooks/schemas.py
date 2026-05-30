import uuid
from pydantic import BaseModel, ConfigDict


class WebhookCreate(BaseModel):
    event_types: list[str]
    url: str


class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    app_id: uuid.UUID
    event_types: list[str]
    url: str
    secret: str
    is_active: bool
