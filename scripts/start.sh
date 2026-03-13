#!/usr/bin/env bash
set -e

echo "Running database migrations with Atlas..."
# ATLAS_DATABASE_URL must use the plain postgresql:// driver (not asyncpg)
atlas migrate apply \
  --url "${ATLAS_DATABASE_URL}" \
  --dir "file://migrations" \
  --allow-dirty

echo "Starting Moonsbow Core API..."
# Enable --reload only in development to avoid overhead in production
if [ "${APP_ENV:-development}" = "development" ]; then
  exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
else
  exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}"
fi
