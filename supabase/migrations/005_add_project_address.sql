-- Migration: Add address fields to projects table
-- Projects can have different addresses from the client's address

ALTER TABLE projects
ADD COLUMN project_address_street TEXT,
ADD COLUMN project_address_city TEXT,
ADD COLUMN project_address_state TEXT,
ADD COLUMN project_address_zip TEXT,
ADD COLUMN project_address_unit TEXT,
ADD COLUMN project_address_county TEXT;

-- Add helpful comments
COMMENT ON COLUMN projects.project_address_street IS 'Project location street address (can differ from client address)';
COMMENT ON COLUMN projects.project_address_city IS 'Project location city';
COMMENT ON COLUMN projects.project_address_state IS 'Project location state';
COMMENT ON COLUMN projects.project_address_zip IS 'Project location ZIP code';
COMMENT ON COLUMN projects.project_address_unit IS 'Project location unit/apt number';
COMMENT ON COLUMN projects.project_address_county IS 'Project location county (extracted from Google Places)';
