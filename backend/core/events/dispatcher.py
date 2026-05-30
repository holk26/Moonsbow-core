import logging
import uuid
from collections import defaultdict
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

EventHandler = Callable[[str, Any], Coroutine[Any, Any, None]]


class EventDispatcher:
    def __init__(self):
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        self._handlers[event_type].append(handler)
        logger.debug(f"Subscribed handler {handler.__name__} to event {event_type}")

    async def publish(self, event_type: str, payload: Any = None, app_id: uuid.UUID | None = None) -> None:
        handlers = self._handlers.get(event_type, [])
        logger.info(f"Publishing event {event_type} to {len(handlers)} handlers")
        for handler in handlers:
            try:
                await handler(event_type, payload)
            except Exception as e:
                logger.error(f"Handler {handler.__name__} failed for event {event_type}: {e}")
        
        # Trigger webhook delivery
        try:
            from backend.modules.webhooks.tasks import deliver_webhook
            from backend.modules.webhooks.service import WebhookService
            from backend.core.database.session import AsyncSessionLocal
            
            async with AsyncSessionLocal() as db:
                service = WebhookService(db)
                subs = await service.get_active_subscriptions(event_type)
                for sub in subs:
                    if app_id and sub.app_id != app_id:
                        continue
                    event_id = str(uuid.uuid4())
                    payload_str = service.build_payload(
                        event_id=event_id,
                        event_type=event_type,
                        app_id=sub.app_id,
                        data=payload or {},
                    )
                    deliver_webhook.delay(sub.url, sub.secret, payload_str)
        except Exception as e:
            logger.error(f"Webhook delivery trigger failed: {e}")


_dispatcher: EventDispatcher | None = None


def get_dispatcher() -> EventDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = EventDispatcher()
    return _dispatcher
