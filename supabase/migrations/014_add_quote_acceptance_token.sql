-- Add acceptance token for public quote acceptance
-- Migration: 014

-- Add acceptance_token column to quotes table
ALTER TABLE quotes
ADD COLUMN acceptance_token UUID DEFAULT uuid_generate_v4();

-- Create unique index on acceptance_token
CREATE UNIQUE INDEX idx_quotes_acceptance_token ON quotes(acceptance_token);

-- Generate tokens for existing quotes that don't have one
UPDATE quotes
SET acceptance_token = uuid_generate_v4()
WHERE acceptance_token IS NULL;

-- Make acceptance_token NOT NULL after populating existing rows
ALTER TABLE quotes
ALTER COLUMN acceptance_token SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotes.acceptance_token IS 'Unique token for public quote acceptance link (used in email)';

-- Add RLS policy to allow public read access by acceptance token (for quote acceptance page)
CREATE POLICY "Public can view quotes by acceptance token"
  ON quotes FOR SELECT
  USING (acceptance_token IS NOT NULL);

-- Add RLS policy to allow public update of status by acceptance token
CREATE POLICY "Public can accept quotes by token"
  ON quotes FOR UPDATE
  USING (acceptance_token IS NOT NULL)
  WITH CHECK (
    -- Only allow updating the status field
    status IN ('accepted', 'rejected')
  );

-- Add RLS policy to allow public read access to contractor info for quotes
CREATE POLICY "Public can view contractor info for public quotes"
  ON contractors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.contractor_id = contractors.id
      AND quotes.acceptance_token IS NOT NULL
    )
  );

-- Add RLS policy to allow public read access to client info for quotes
CREATE POLICY "Public can view client info for public quotes"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.client_id = clients.id
      AND quotes.acceptance_token IS NOT NULL
    )
  );
