from celery import Celery
from backend.core.config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "moonsbow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "backend.workers.tasks.email_tasks",
        "backend.workers.tasks.analytics_tasks",
        "backend.workers.tasks.ai_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
