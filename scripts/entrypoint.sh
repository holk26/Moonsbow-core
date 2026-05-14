#!/usr/bin/env bash
# Unified entrypoint for Moonsbow Core.
#
# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
set -e

APP_MODE="${APP_MODE:-api}"

# Validate required environment variables
validate_env() {
    local missing=()
    
    if [ -z "${SECRET_KEY:-}" ]; then
        missing+=("SECRET_KEY")
    fi
    
    if [ -z "${DATABASE_URL:-}" ]; then
        missing+=("DATABASE_URL")
    fi
    
    if [ -z "${ATLAS_DATABASE_URL:-}" ]; then
        missing+=("ATLAS_DATABASE_URL")
    fi
    
    if [ -z "${REDIS_URL:-}" ]; then
        missing+=("REDIS_URL")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo "ERROR: Missing required environment variables:" >&2
        for var in "${missing[@]}"; do
            echo "  - $var" >&2
        done
        exit 1
    fi
}

case "$APP_MODE" in
  api)
    echo "==> [api] Validating environment..."
    validate_env
    
    echo "==> [api] Running database migrations with Atlas..."
    # ATLAS_DATABASE_URL must use plain postgresql:// (not asyncpg)
    # Append sslmode=disable if not present (Dokploy internal Postgres typically has no SSL)
    ATLAS_URL="${ATLAS_DATABASE_URL}"
    if [[ "${ATLAS_URL}" != *"sslmode="* ]]; then
        # Add ?sslmode=disable or &sslmode=disable depending on existing query params
        if [[ "${ATLAS_URL}" == *"?"* ]]; then
            ATLAS_URL="${ATLAS_URL}&sslmode=disable"
        else
            ATLAS_URL="${ATLAS_URL}?sslmode=disable"
        fi
    fi
    echo "==> [api] Using Atlas URL: ${ATLAS_URL//:*@/:***@}"  # mask password in logs

    # Regenerate hash if needed, then apply migrations
    echo "==> [api] Regenerating Atlas migration hash..."
    atlas migrate hash --dir "file://migrations" || true
    
    # --allow-dirty permits applying migrations even if the checksum doesn't match
    if ! atlas migrate apply \
      --url "${ATLAS_URL}" \
      --dir "file://migrations" \
      --allow-dirty; then
        echo "WARNING: Atlas migration failed. Continuing anyway..." >&2
        echo "If this is the first deployment, the database may already be initialized." >&2
    fi

    # Create default admin user if configured
    if [ -n "${DEFAULT_ADMIN_EMAIL:-}" ] && [ -n "${DEFAULT_ADMIN_PASSWORD:-}" ]; then
        echo "==> [api] Creating default admin user..."
        python3 scripts/init_default_user.py || echo "WARNING: Failed to create default user, continuing..."
    fi

    echo "==> [api] Starting Moonsbow Core API..."
    if [ "${APP_ENV:-development}" = "development" ]; then
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
    else
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --workers "${UVICORN_WORKERS:-1}"
    fi
    ;;

  worker)
    echo "==> [worker] Validating environment..."
    validate_env
    
    echo "==> [worker] Starting Moonsbow Core Celery Worker..."
    exec celery -A backend.workers.worker worker \
      --loglevel=info \
      --concurrency="${CELERY_CONCURRENCY:-4}"
    ;;

  *)
    echo "ERROR: Unknown APP_MODE='${APP_MODE}'. Valid values: api, worker" >&2
    exit 1
    ;;
esac
