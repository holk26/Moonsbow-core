import uuid
from pydantic import BaseModel, ConfigDict


class TransactionCreate(BaseModel):
    tenant_id: uuid.UUID
    reference: str
    type: str
    amount: float
    currency: str = "USD"
    description: str | None = None
    transaction_metadata: dict | None = None
    user_id: uuid.UUID | None = None

    model_config = ConfigDict(populate_by_name=True)


class TransactionUpdate(BaseModel):
    status: str | None = None
    description: str | None = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    reference: str
    type: str
    amount: float
    currency: str
    status: str
    description: str | None
    user_id: uuid.UUID | None
