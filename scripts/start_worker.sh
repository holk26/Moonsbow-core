#!/usr/bin/env bash
set -e

echo "Starting Moonsbow Core Celery Worker..."
exec celery -A backend.workers.worker worker --loglevel=info --concurrency=4
