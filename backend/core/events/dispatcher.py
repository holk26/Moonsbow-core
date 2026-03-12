import logging
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

    async def publish(self, event_type: str, payload: Any = None) -> None:
        handlers = self._handlers.get(event_type, [])
        logger.info(f"Publishing event {event_type} to {len(handlers)} handlers")
        for handler in handlers:
            try:
                await handler(event_type, payload)
            except Exception as e:
                logger.error(f"Handler {handler.__name__} failed for event {event_type}: {e}")


_dispatcher: EventDispatcher | None = None


def get_dispatcher() -> EventDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = EventDispatcher()
    return _dispatcher
