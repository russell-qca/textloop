-- Add city and state to contractors table for weather
-- Migration: 017

-- Add city and state columns to contractors table
ALTER TABLE contractors
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN contractors.city IS 'City where contractor is based (used for weather forecast)';
COMMENT ON COLUMN contractors.state IS 'State where contractor is based (used for weather forecast)';
