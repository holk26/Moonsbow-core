from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config.settings import get_settings
from backend.core.config.logging import configure_logging
from backend.core.database.session import init_db
from backend.api.router import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    await init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Moonsbow Core Backend API",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app
