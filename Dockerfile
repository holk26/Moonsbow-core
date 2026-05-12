# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copy dependency files
COPY pyproject.toml ./

# If poetry.lock exists in the build context, copy it for reproducible builds.
# If it doesn't exist, Poetry will resolve dependencies from pyproject.toml.
RUN if test -f poetry.lock; then \
        echo "Using existing poetry.lock"; \
    else \
        echo "No poetry.lock found, will generate one"; \
    fi

# Configure Poetry and install dependencies
# --no-root: don't install the project package itself
# --without dev: skip dev dependencies
# --no-interaction --no-ansi: non-interactive mode for CI/CD
RUN poetry config virtualenvs.create false \
    && poetry lock --no-interaction \
    && poetry install --no-interaction --no-ansi --no-root --without dev

# Stage 2: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install runtime dependencies only (no build tools needed)
# curl is needed to install Atlas CLI
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSf https://atlasgo.sh | sh \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x scripts/entrypoint.sh

# Expose the application port
EXPOSE 8000

# APP_MODE controls what this container runs:
#   api    (default) — runs Atlas migrations then starts the FastAPI server
#   worker           — starts the Celery background worker (no migrations)
ENV APP_MODE=api

ENTRYPOINT ["bash", "scripts/entrypoint.sh"]
