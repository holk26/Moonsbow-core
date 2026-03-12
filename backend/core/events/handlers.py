import logging
from typing import Any

logger = logging.getLogger(__name__)


class BaseEventHandler:
    async def __call__(self, event_type: str, payload: Any) -> None:
        await self.handle(event_type, payload)

    async def handle(self, event_type: str, payload: Any) -> None:
        raise NotImplementedError


class LoggingHandler(BaseEventHandler):
    async def handle(self, event_type: str, payload: Any) -> None:
        logger.info(f"Event received: {event_type}, payload: {payload}")


async def on_user_registered(event_type: str, payload: Any) -> None:
    logger.info(f"User registered event: {payload}")


async def on_tenant_created(event_type: str, payload: Any) -> None:
    logger.info(f"Tenant created event: {payload}")
