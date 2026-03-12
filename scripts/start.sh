#!/usr/bin/env bash
set -e

echo "Starting Moonsbow Core API..."
exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
