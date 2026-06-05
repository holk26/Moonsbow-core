#!/usr/bin/env python3
"""One-off migration to add sync_url column to apps table.

This script runs synchronously using psycopg2 to avoid async complexity
in the entrypoint. It is idempotent: safe to run multiple times.
"""
import os
import sys

from sqlalchemy import create_engine, text


def main() -> int:
    db_url = os.environ.get("ATLAS_DATABASE_URL")
    if not db_url:
        print("ERROR: ATLAS_DATABASE_URL not set", file=sys.stderr)
        return 1

    # Use plain postgresql:// for synchronous connection
    engine = create_engine(db_url)

    with engine.begin() as conn:
        # Idempotent: only add column if it doesn't exist
        conn.execute(
            text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'apps' AND column_name = 'sync_url'
                    ) THEN
                        ALTER TABLE apps ADD COLUMN sync_url VARCHAR(500);
                    END IF;
                END $$;
            """)
        )

    print("OK: sync_url column ensured on apps table")
    return 0


if __name__ == "__main__":
    sys.exit(main())
