-- Migration: Add title, summary, and description fields to quotes table

ALTER TABLE quotes
ADD COLUMN quote_title TEXT,
ADD COLUMN quote_summary TEXT,
ADD COLUMN quote_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN quotes.quote_title IS 'Title of the quote';
COMMENT ON COLUMN quotes.quote_summary IS 'Brief summary of the quote';
COMMENT ON COLUMN quotes.quote_description IS 'Detailed description with HTML formatting';
