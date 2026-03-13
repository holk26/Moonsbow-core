import uuid
from pydantic import BaseModel, ConfigDict


class MenuItemCreate(BaseModel):
    tenant_id: uuid.UUID
    name: str
    description: str | None = None
    price: float
    category: str | None = None
    image_url: str | None = None


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    category: str | None = None
    is_available: bool | None = None
    image_url: str | None = None


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    description: str | None
    price: float
    category: str | None
    is_available: bool
    image_url: str | None


class OrderCreate(BaseModel):
    tenant_id: uuid.UUID
    customer_id: uuid.UUID | None = None
    items: dict | None = None
    notes: str | None = None
    total_amount: float = 0.0


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_id: uuid.UUID | None
    status: str
    total_amount: float
    items: dict | None
    notes: str | None
