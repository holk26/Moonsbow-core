import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.plugins.finance.repository import TransactionRepository
from backend.plugins.finance.schemas import TransactionCreate, TransactionUpdate, TransactionResponse

logger = logging.getLogger(__name__)


class FinanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TransactionRepository(db)

    async def create_transaction(self, data: TransactionCreate) -> TransactionResponse:
        existing = await self.repo.get_by_reference(data.reference)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Transaction reference already exists")
        tx_data = data.model_dump(by_alias=False)
        tx = await self.repo.create(tx_data)
        return TransactionResponse.model_validate(tx)

    async def get_transaction(self, tx_id: uuid.UUID) -> TransactionResponse:
        tx = await self.repo.get_by_id(tx_id)
        if not tx:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        return TransactionResponse.model_validate(tx)

    async def list_transactions(self, tenant_id: uuid.UUID, page: int = 1, size: int = 20) -> list[TransactionResponse]:
        offset = (page - 1) * size
        txs = await self.repo.list_by_tenant(tenant_id=tenant_id, offset=offset, limit=size)
        return [TransactionResponse.model_validate(t) for t in txs]

    async def update_transaction(self, tx_id: uuid.UUID, data: TransactionUpdate) -> TransactionResponse:
        tx = await self.repo.get_by_id(tx_id)
        if not tx:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        updates = data.model_dump(exclude_unset=True)
        tx = await self.repo.update(tx, **updates)
        return TransactionResponse.model_validate(tx)
