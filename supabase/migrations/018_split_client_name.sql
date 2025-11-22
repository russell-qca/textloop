-- Split client_name into first_name and last_name
-- Migration: 018

-- Add first_name and last_name columns
ALTER TABLE clients
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Populate first_name and last_name from existing client_name
-- Split on first space: "John Doe" -> first_name: "John", last_name: "Doe"
UPDATE clients
SET
  first_name = CASE
    WHEN position(' ' in client_name) > 0
    THEN substring(client_name from 1 for position(' ' in client_name) - 1)
    ELSE client_name
  END,
  last_name = CASE
    WHEN position(' ' in client_name) > 0
    THEN substring(client_name from position(' ' in client_name) + 1)
    ELSE ''
  END;

-- Make first_name and last_name NOT NULL after populating
ALTER TABLE clients
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Drop old client_name column
ALTER TABLE clients
DROP COLUMN client_name;

-- Add comments
COMMENT ON COLUMN clients.first_name IS 'Client first name';
COMMENT ON COLUMN clients.last_name IS 'Client last name';
