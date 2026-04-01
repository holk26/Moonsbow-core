#!/usr/bin/env bash
# Unified entrypoint for Moonsbow Core.
#
# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
set -e

APP_MODE="${APP_MODE:-api}"

# ---------------------------------------------------------------------------
# wait_for_postgres — retry until PostgreSQL accepts a connection.
# Uses pg_isready (shipped with libpq-dev) so no extra tooling is required.
# Usage: wait_for_postgres <host> <port> <user>
# ---------------------------------------------------------------------------
wait_for_postgres() {
  local host="${1}"
  local port="${2:-5432}"
  local user="${3:-postgres}"
  local retries="${WAIT_DB_RETRIES:-30}"
  local delay="${WAIT_DB_DELAY:-2}"

  echo "==> Waiting for PostgreSQL at ${host}:${port} (max ${retries} attempts)..."
  for i in $(seq 1 "${retries}"); do
    if pg_isready -h "${host}" -p "${port}" -U "${user}" -q; then
      echo "==> PostgreSQL is ready."
      return 0
    fi
    echo "    attempt ${i}/${retries} — not ready yet, retrying in ${delay}s..."
    sleep "${delay}"
  done

  echo "ERROR: PostgreSQL at ${host}:${port} did not become ready in time." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# wait_for_redis — retry until Redis responds to PING.
# Uses a Python one-liner (Python is always available in the container) so
# we can verify the actual +PONG response rather than only the TCP connection.
# Usage: wait_for_redis <host> <port>
# ---------------------------------------------------------------------------
wait_for_redis() {
  local host="${1}"
  local port="${2:-6379}"
  local retries="${WAIT_REDIS_RETRIES:-30}"
  local delay="${WAIT_REDIS_DELAY:-2}"

  echo "==> Waiting for Redis at ${host}:${port} (max ${retries} attempts)..."
  for i in $(seq 1 "${retries}"); do
    if REDIS_HOST="${host}" REDIS_PORT="${port}" python3 -c "
import socket, sys, os
try:
    s = socket.create_connection((os.environ['REDIS_HOST'], int(os.environ['REDIS_PORT'])), timeout=2)
    s.sendall(b'*1\r\n\$4\r\nPING\r\n')
    data = s.recv(100)
    s.close()
    sys.exit(0 if b'+PONG' in data else 1)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
      echo "==> Redis is ready."
      return 0
    fi
    echo "    attempt ${i}/${retries} — not ready yet, retrying in ${delay}s..."
    sleep "${delay}"
  done

  echo "ERROR: Redis at ${host}:${port} did not become ready in time." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Parse host/port from a URL of the form:
#   postgresql[+driver]://user:pass@host:port/db
#   redis://host:port/db
# ---------------------------------------------------------------------------
parse_host_port() {
  # $1 = URL, $2 = default_port
  # prints "host port"
  local url="${1}"
  local default_port="${2}"
  # Strip scheme (everything up to and including ://)
  local rest="${url#*://}"
  # Strip userinfo (user:pass@)
  rest="${rest#*@}"
  # Strip path (/db)
  rest="${rest%%/*}"
  # rest is now  host:port  or just  host
  local host="${rest%%:*}"
  local port="${rest##*:}"
  # If no colon was present, port equals host (no port specified)
  if [ "${port}" = "${host}" ]; then
    port="${default_port}"
  fi
  echo "${host} ${port}"
}

case "$APP_MODE" in
  api)
    # ---- Validate database connection before running migrations -----------
    DB_HOST_PORT=$(parse_host_port "${ATLAS_DATABASE_URL:-}" "5432")
    DB_HOST=$(echo "${DB_HOST_PORT}" | cut -d' ' -f1)
    DB_PORT=$(echo "${DB_HOST_PORT}" | cut -d' ' -f2)
    # Extract username from the URL (between :// and :password)
    DB_USER=$(echo "${ATLAS_DATABASE_URL:-postgres}" | sed 's|.*://||;s|:.*||')

    if [ -n "${DB_HOST}" ]; then
      wait_for_postgres "${DB_HOST}" "${DB_PORT}" "${DB_USER}"
    else
      echo "WARNING: ATLAS_DATABASE_URL is not set; skipping database readiness check." >&2
    fi

    echo "==> [api] Running database migrations with Atlas..."
    # ATLAS_DATABASE_URL must use plain postgresql:// (not asyncpg)
    atlas migrate apply \
      --url "${ATLAS_DATABASE_URL}" \
      --dir "file://migrations" \
      --allow-dirty

    # ---- Validate Redis connection -----------------------------------------
    REDIS_HOST_PORT=$(parse_host_port "${REDIS_URL:-}" "6379")
    REDIS_HOST=$(echo "${REDIS_HOST_PORT}" | cut -d' ' -f1)
    REDIS_PORT=$(echo "${REDIS_HOST_PORT}" | cut -d' ' -f2)

    if [ -n "${REDIS_HOST}" ]; then
      wait_for_redis "${REDIS_HOST}" "${REDIS_PORT}"
    else
      echo "WARNING: REDIS_URL is not set; skipping Redis readiness check." >&2
    fi

    echo "==> [api] Starting Moonsbow Core API..."
    if [ "${APP_ENV:-development}" = "development" ]; then
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
    else
      exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --workers "${UVICORN_WORKERS:-1}"
    fi
    ;;

  worker)
    # ---- Validate Redis connection before starting the worker -------------
    REDIS_HOST_PORT=$(parse_host_port "${CELERY_BROKER_URL:-${REDIS_URL:-}}" "6379")
    REDIS_HOST=$(echo "${REDIS_HOST_PORT}" | cut -d' ' -f1)
    REDIS_PORT=$(echo "${REDIS_HOST_PORT}" | cut -d' ' -f2)

    if [ -n "${REDIS_HOST}" ]; then
      wait_for_redis "${REDIS_HOST}" "${REDIS_PORT}"
    else
      echo "WARNING: CELERY_BROKER_URL/REDIS_URL is not set; skipping Redis readiness check." >&2
    fi

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
