# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install poetry==1.8.3

COPY pyproject.toml poetry.lock* ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --without dev

# Stage 2: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSf https://atlasgo.sh | sh \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

RUN chmod +x scripts/entrypoint.sh

EXPOSE 8000

# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
ENV APP_MODE=api

ENTRYPOINT ["bash", "scripts/entrypoint.sh"]
