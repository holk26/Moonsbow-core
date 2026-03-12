import uuid
from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    tenant_id: uuid.UUID
    event_type: str
    source: str
    payload: dict | None = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    event_type: str
    source: str
    payload: dict | None
    status: str
