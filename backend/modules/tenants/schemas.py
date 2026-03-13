import uuid
from pydantic import BaseModel, ConfigDict


class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"
    description: str | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    plan: str | None = None
    description: str | None = None
    is_active: bool | None = None


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    plan: str
    is_active: bool
    description: str | None
