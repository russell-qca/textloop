-- Add company branding and address fields to contractors table

-- Add logo URL field (will store the public URL from Supabase Storage)
ALTER TABLE contractors
ADD COLUMN logo_url TEXT;

-- Add company address fields
ALTER TABLE contractors
ADD COLUMN street_address TEXT,
ADD COLUMN address_unit TEXT,
ADD COLUMN zip_code TEXT;

-- Note: city and state already exist in contractors table (added in migration 017)

-- Add comment to logo_url column
COMMENT ON COLUMN contractors.logo_url IS 'Public URL to company logo stored in Supabase Storage';
