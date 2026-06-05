-- Add sync_url column to apps table for hub-and-spoke architecture
ALTER TABLE apps ADD COLUMN sync_url VARCHAR(500);
