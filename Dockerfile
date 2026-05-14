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

# Configure Poetry and install dependencies
RUN poetry config virtualenvs.create false \
    && poetry lock --no-interaction \
    && poetry install --no-interaction --no-ansi --no-root --without dev

# Stage 2: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSf https://atlasgo.sh | sh \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code explicitly (not using . to avoid cache issues)
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY migrations/ ./migrations/
COPY atlas.hcl ./
COPY VERSION ./

# Make entrypoint executable
RUN chmod +x scripts/entrypoint.sh

# Verify the password.py fix is present
RUN grep -n "plain\[:71\]" backend/core/security/password.py || (echo "ERROR: password.py fix not found!" && exit 1)

# Expose the application port
EXPOSE 8000

ENV APP_MODE=api

ENTRYPOINT ["bash", "scripts/entrypoint.sh"]
