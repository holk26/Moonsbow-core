# Atlas configuration for Moonsbow Core
# https://atlasgo.io/
#
# Usage:
#   atlas migrate diff --env local          # Generate migration from schema changes
#   atlas migrate apply --env local         # Apply pending migrations
#   atlas migrate hash                      # Regenerate atlas.sum after editing migrations
#   atlas schema inspect --env local        # Inspect current schema
#
# Set ATLAS_DATABASE_URL to a plain postgresql:// URL (not postgresql+asyncpg://).
# Example: postgresql://moonsbow:moonsbow@localhost:5432/moonsbow

data "external_schema" "sqlalchemy" {
  program = [
    "python",
    "migrations/schema.py",
  ]
}

locals {
  atlas_db_url = getenv("ATLAS_DATABASE_URL")
}

env "local" {
  src = data.external_schema.sqlalchemy.url
  dev = "docker://postgres/15/dev?search_path=public"
  url = local.atlas_db_url
  migration {
    dir = "file://migrations"
  }
}

env "docker" {
  src = data.external_schema.sqlalchemy.url
  dev = "docker://postgres/15/dev?search_path=public"
  # In docker-compose, postgres is reachable at the service hostname.
  # Override ATLAS_DATABASE_URL to point to the postgres service, e.g.:
  #   postgresql://moonsbow:moonsbow@postgres:5432/moonsbow
  url = local.atlas_db_url
  migration {
    dir = "file://migrations"
  }
}
