import logging
import json
import hmac
import hashlib
from datetime import datetime, timezone

import httpx
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=4)
def deliver_webhook(self, url: str, secret: str, payload: str):
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": f"sha256={signature}",
    }
    try:
        response = httpx.post(url, headers=headers, content=payload, timeout=30.0)
        response.raise_for_status()
        logger.info(f"Webhook delivered to {url}: {response.status_code}")
    except Exception as exc:
        logger.warning(f"Webhook delivery failed to {url}: {exc}")
        retry_in = [60, 300, 900, 3600][self.request.retries]
        raise self.retry(exc=exc, countdown=retry_in)
