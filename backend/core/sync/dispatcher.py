import json
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from backend.modules.apps.repository import AppRepository
from backend.modules.webhooks.tasks import deliver_sync_webhook

logger = logging.getLogger(__name__)


class SyncDispatcher:
    """Dispatches sync webhooks to all active apps when Moonsbow data changes.

    Each app maintains local replicas of users, tenants, and subscriptions.
    When data changes in Moonsbow, this dispatcher pushes the update via
    a signed webhook so the app can update its local tables.
    """

    async def dispatch(
        self,
        event_type: str,
        payload: dict,
        db: AsyncSession,
        app_id: str | None = None,
    ) -> None:
        """Send sync webhook to target app (or all active apps if app_id is None)."""
        repo = AppRepository(db)

        if app_id:
            apps = [await repo.get_by_id(app_id)]
        else:
            apps = await repo.get_active_apps()

        sync_payload = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }

        for app in apps:
            if not app or not app.sync_url:
                continue

            payload_str = json.dumps(sync_payload, default=str)
            deliver_sync_webhook.delay(app.sync_url, app.api_key, payload_str)
            logger.info(f"Sync {event_type} dispatched to {app.name} at {app.sync_url}")


_sync_dispatcher: SyncDispatcher | None = None


def get_sync_dispatcher() -> SyncDispatcher:
    global _sync_dispatcher
    if _sync_dispatcher is None:
        _sync_dispatcher = SyncDispatcher()
    return _sync_dispatcher
