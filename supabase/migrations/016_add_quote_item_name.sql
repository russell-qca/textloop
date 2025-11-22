-- Add name field to quote_items
-- Migration: 016

-- Add name column to quote_items table
ALTER TABLE quote_items
ADD COLUMN name TEXT;

-- Update existing items with default names
UPDATE quote_items
SET name = 'Item ' || (sort_order + 1)::text
WHERE name IS NULL;

-- Make name NOT NULL after populating existing rows
ALTER TABLE quote_items
ALTER COLUMN name SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quote_items.name IS 'Name/title of the line item (e.g., "Labor", "Materials", etc.)';
