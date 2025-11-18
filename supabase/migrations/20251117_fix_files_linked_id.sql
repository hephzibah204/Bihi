-- Add linked_id column to files if missing
ALTER TABLE files ADD COLUMN IF NOT EXISTS linked_id text;

