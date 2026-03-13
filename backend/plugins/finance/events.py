from backend.core.events.event_types import EventType
from backend.core.events.dispatcher import get_dispatcher


async def emit_transaction_created(tx_id: str, tenant_id: str, amount: float, type: str) -> None:
    dispatcher = get_dispatcher()
    await dispatcher.publish(
        EventType.TRANSACTION_CREATED,
        {"transaction_id": tx_id, "tenant_id": tenant_id, "amount": amount, "type": type},
    )
