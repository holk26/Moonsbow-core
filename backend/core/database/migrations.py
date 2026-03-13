import logging
from alembic import command
from alembic.config import Config

logger = logging.getLogger(__name__)


def run_migrations(alembic_cfg_path: str = "migrations/alembic.ini") -> None:
    alembic_cfg = Config(alembic_cfg_path)
    command.upgrade(alembic_cfg, "head")
    logger.info("Database migrations completed")
