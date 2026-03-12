import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plugins.finance.models import Transaction

logger = logging.getLogger(__name__)


class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Transaction:
        # Map metadata_ alias
        if "metadata_" in data:
            data["metadata_"] = data.pop("metadata_")
        tx = Transaction(**data)
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    async def get_by_id(self, tx_id: uuid.UUID) -> Transaction | None:
        result = await self.db.execute(select(Transaction).where(Transaction.id == tx_id))
        return result.scalar_one_or_none()

    async def get_by_reference(self, reference: str) -> Transaction | None:
        result = await self.db.execute(select(Transaction).where(Transaction.reference == reference))
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Transaction]:
        result = await self.db.execute(
            select(Transaction).where(Transaction.tenant_id == tenant_id).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, tx: Transaction, **kwargs) -> Transaction:
        for key, value in kwargs.items():
            setattr(tx, key, value)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx
