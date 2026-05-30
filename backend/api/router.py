from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.modules.auth.router import router as auth_router
from backend.modules.tenants.router import router as tenants_router
from backend.modules.billing.router import router as billing_router
from backend.modules.events.router import router as events_router
from backend.modules.notifications.router import router as notifications_router
from backend.modules.apps.router import router as apps_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(billing_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
api_router.include_router(apps_router)
