-- Add email tracking to quotes table
-- Migration: 013

-- Add last_emailed_at column to track when quote was last sent via email
ALTER TABLE quotes
ADD COLUMN last_emailed_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN quotes.last_emailed_at IS 'Timestamp when the quote was last sent via email';
