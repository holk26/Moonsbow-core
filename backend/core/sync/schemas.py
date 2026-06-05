from pydantic import BaseModel
from typing import Any


class SyncPayload(BaseModel):
    event_type: str
    app_id: str | None = None
    payload: dict[str, Any]
    timestamp: str
