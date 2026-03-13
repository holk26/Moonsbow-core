import logging
import subprocess

logger = logging.getLogger(__name__)

_MIGRATION_TIMEOUT_SECONDS = 120


def run_migrations(
    url: str,
    dir: str = "file://migrations",
    env: str | None = None,
    allow_dirty: bool = False,
) -> None:
    """Apply pending Atlas migrations.

    Args:
        url: PostgreSQL connection URL (``postgresql://...``).
        dir: Path to the Atlas migration directory (default: ``file://migrations``).
        env: Optional Atlas environment name defined in ``atlas.hcl``.
             When provided, ``url`` and ``dir`` are ignored in favour of the
             env configuration.
        allow_dirty: Apply migrations even when the ``atlas.sum`` file is
                     missing or out of date.  Should only be used in
                     development or CI environments.
    """
    cmd = ["atlas", "migrate", "apply"]

    if env:
        cmd += ["--env", env]
    else:
        cmd += ["--url", url, "--dir", dir]

    if allow_dirty:
        cmd.append("--allow-dirty")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=_MIGRATION_TIMEOUT_SECONDS,
    )
    if result.returncode != 0:
        # Avoid leaking connection credentials from stderr into logs/exceptions
        safe_stderr = _redact_url(result.stderr)
        raise RuntimeError(f"Atlas migration failed:\n{safe_stderr}")

    logger.info("Database migrations completed: %s", result.stdout.strip())


def _redact_url(text: str) -> str:
    """Replace any postgresql:// credentials in *text* with placeholders."""
    import re

    return re.sub(
        r"(postgresql(?:\+\w+)?://)[^@/\s]+:[^@/\s]+(@)",
        r"\1***:***\2",
        text,
    )
