import logging
from backend.workers.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="email.send", bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body: str, html_body: str | None = None) -> dict:
    try:
        logger.info(f"Sending email to {to}: {subject}")
        # TODO: Integrate with actual email provider (SendGrid, SES, etc.)
        # html_body is reserved for rich HTML email content when provider is integrated
        return {"status": "sent", "to": to, "subject": subject}
    except Exception as exc:
        logger.error(f"Failed to send email to {to}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="email.send_bulk")
def send_bulk_email(recipients: list[dict], subject: str, body: str) -> dict:
    results = []
    for recipient in recipients:
        send_email.delay(recipient["email"], subject, body)
        results.append(recipient["email"])
    return {"status": "queued", "count": len(results)}
