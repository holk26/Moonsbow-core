#!/usr/bin/env bash
# Unified entrypoint for Moonsbow Core.
#
# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
set -e

APP_MODE="${APP_MODE:-api}"

case "$APP_MODE" in
  api)
    echo "==> [api] Running database migrations with Atlas..."
    # ATLAS_DATABASE_URL must use plain postgresql:// (not asyncpg)
    atlas migrate apply \
      --url "${ATLAS_DATABASE_URL}" \
      --dir "file://migrations" \
      --allow-dirty

    echo "==> [api] Starting Moonsbow Core API..."
    if [ "${APP_ENV:-development}" = "development" ]; then
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
    else
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --workers "${UVICORN_WORKERS:-1}"
    fi
    ;;

  worker)
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
