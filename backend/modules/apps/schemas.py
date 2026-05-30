import uuid
from pydantic import BaseModel, ConfigDict


class AppCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    webhook_url: str | None = None


class AppUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    webhook_url: str | None = None
    is_active: bool | None = None


class AppResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    api_key: str
    webhook_url: str | None
    is_active: bool
    description: str | None
