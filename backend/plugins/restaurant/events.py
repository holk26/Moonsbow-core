from backend.core.events.event_types import EventType
from backend.core.events.dispatcher import get_dispatcher


async def emit_order_placed(order_id: str, tenant_id: str, total_amount: float) -> None:
    dispatcher = get_dispatcher()
    await dispatcher.publish(
        EventType.ORDER_PLACED,
        {"order_id": order_id, "tenant_id": tenant_id, "total_amount": total_amount},
    )


async def emit_order_completed(order_id: str, tenant_id: str) -> None:
    dispatcher = get_dispatcher()
    await dispatcher.publish(
        EventType.ORDER_COMPLETED,
        {"order_id": order_id, "tenant_id": tenant_id},
    )
