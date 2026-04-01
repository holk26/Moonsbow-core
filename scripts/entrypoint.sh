#!/usr/bin/env bash
# Unified entrypoint for Moonsbow Core.
#
# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
set -e

APP_MODE="${APP_MODE:-api}"

# ---------------------------------------------------------------------------
# wait_for_postgres — retry until the PostgreSQL *server* accepts connections.
# Connects to the default "postgres" database (not the app DB) so that the
# check succeeds even before the application database has been created.
# Uses Python + psycopg2 (always present in the container image).
# Usage: wait_for_postgres <postgresql-url>
# ---------------------------------------------------------------------------
wait_for_postgres() {
  local url="${1}"
  local retries="${WAIT_DB_RETRIES:-60}"
  local delay="${WAIT_DB_DELAY:-2}"

  echo "==> Waiting for PostgreSQL server to be ready (max ${retries} attempts, ${delay}s delay)..."
  for i in $(seq 1 "${retries}"); do
    if PGURL="${url}" python3 -c "
import sys, os
try:
    import psycopg2
    from urllib.parse import urlparse, urlunparse
    u = urlparse(os.environ['PGURL'])
    # Connect to the default 'postgres' admin DB so the check works even
    # before the application database has been created.
    server_url = urlunparse(u._replace(path='/postgres'))
    conn = psycopg2.connect(server_url, connect_timeout=2)
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
      echo "==> PostgreSQL server is ready."
      return 0
    fi
    echo "    attempt ${i}/${retries} — not ready yet, retrying in ${delay}s..."
    sleep "${delay}"
  done

  echo "ERROR: PostgreSQL server did not become ready after ${retries} attempts." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# ensure_database_exists — create the application database if it doesn't
# exist yet.  Connects to the "postgres" admin database and issues
# CREATE DATABASE only when the target DB is absent.
# Usage: ensure_database_exists <postgresql-url>
# ---------------------------------------------------------------------------
ensure_database_exists() {
  local url="${1}"

  PGURL="${url}" python3 -c "
import sys, os
try:
    import psycopg2
    from urllib.parse import urlparse, urlunparse
    u = urlparse(os.environ['PGURL'])
    dbname = u.path.lstrip('/')
    server_url = urlunparse(u._replace(path='/postgres'))
    conn = psycopg2.connect(server_url, connect_timeout=5)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute('SELECT 1 FROM pg_database WHERE datname = %s', (dbname,))
    if not cur.fetchone():
        cur.execute('CREATE DATABASE \"' + dbname + '\"')
        print('==> Database \"' + dbname + '\" created.')
    else:
        print('==> Database \"' + dbname + '\" already exists.')
    cur.close()
    conn.close()
    sys.exit(0)
except Exception as e:
    print('ERROR: could not ensure database exists: ' + str(e), file=sys.stderr)
    sys.exit(1)
"
}

# ---------------------------------------------------------------------------
# wait_for_redis — retry until Redis responds to PING.
# Uses a Python socket one-liner to verify the actual +PONG response.
# Usage: wait_for_redis <host> <port>
# ---------------------------------------------------------------------------
wait_for_redis() {
  local host="${1}"
  local port="${2:-6379}"
  local retries="${WAIT_REDIS_RETRIES:-60}"
  local delay="${WAIT_REDIS_DELAY:-2}"

  echo "==> Waiting for Redis at ${host}:${port} (max ${retries} attempts, ${delay}s delay)..."
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

  echo "ERROR: Redis at ${host}:${port} did not become ready after ${retries} attempts." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Parse host/port from a URL of the form:
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
    if [ -n "${ATLAS_DATABASE_URL:-}" ]; then
      wait_for_postgres "${ATLAS_DATABASE_URL}"
      ensure_database_exists "${ATLAS_DATABASE_URL}"
    else
      echo "WARNING: ATLAS_DATABASE_URL is not set; skipping database readiness check." >&2
    fi

    echo "==> [api] Running database migrations with Atlas..."
    # Re-hash the migration directory using the installed Atlas version.
    # This is necessary because the Dockerfile installs the latest Atlas via
    # atlasgo.sh; if Atlas updated its checksum algorithm the stored atlas.sum
    # would be stale.  Re-hashing here is safe: the SQL files are immutable
    # inside the Docker image (built from git).
    atlas migrate hash --dir "file://migrations"
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
      # Redis is used for background tasks (Celery). The API can still serve
      # requests without it, so treat Redis unavailability as a warning only.
      wait_for_redis "${REDIS_HOST}" "${REDIS_PORT}" || \
        echo "WARNING: Redis not available — background tasks will fail but the API will start." >&2
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
