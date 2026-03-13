-- Moonsbow Core Database Initialization
-- This runs on first postgres startup

-- Ensure the moonsbow database exists (already created by POSTGRES_DB env var)
-- Create extensions
\c moonsbow;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE moonsbow TO moonsbow;
GRANT ALL ON SCHEMA public TO moonsbow;
