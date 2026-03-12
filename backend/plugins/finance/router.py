import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.plugins.finance.service import FinanceService
from backend.plugins.finance.schemas import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter(prefix="/finance", tags=["finance"])


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = FinanceService(db)
    return await service.create_transaction(data)


@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
async def get_transaction(
    tx_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = FinanceService(db)
    return await service.get_transaction(tx_id)


@router.get("/tenant/{tenant_id}/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    tenant_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = FinanceService(db)
    return await service.list_transactions(tenant_id=tenant_id, page=page, size=size)


@router.put("/transactions/{tx_id}", response_model=TransactionResponse)
async def update_transaction(
    tx_id: uuid.UUID,
    data: TransactionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = FinanceService(db)
    return await service.update_transaction(tx_id, data)
