"""
Atlas schema provider for Moonsbow Core.

This script is used by Atlas to introspect the SQLAlchemy models and generate
DDL statements for schema management.

Usage:
    atlas schema inspect --env local
    atlas migrate diff --env local
    atlas migrate apply --env local
"""
import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "atlas-schema-inspection-placeholder")

from atlas_provider_sqlalchemy.ddl import print_ddl  # noqa: E402
from backend.core.database.base import Base  # noqa: E402, F401

# Import all models so they register themselves with Base.metadata
import backend.modules.auth.models  # noqa: E402, F401
import backend.modules.tenants.models  # noqa: E402, F401
import backend.modules.billing.models  # noqa: E402, F401
import backend.modules.events.models  # noqa: E402, F401
import backend.modules.notifications.models  # noqa: E402, F401
import backend.modules.apps.models  # noqa: E402, F401
import backend.modules.webhooks.models  # noqa: E402, F401
import backend.plugins.lms.models  # noqa: E402, F401
import backend.plugins.restaurant.models  # noqa: E402, F401
import backend.plugins.finance.models  # noqa: E402, F401

print_ddl("postgresql", [Base])
