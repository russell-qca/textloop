-- Migration: Add 'void' status to quotes
-- This allows contractors to mark quotes as void (cancelled/invalid)

-- Drop the existing check constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Add the new check constraint with 'void' status
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'void'));

-- Update the comment to reflect the new status
COMMENT ON COLUMN quotes.status IS 'Quote status: pending (awaiting response), accepted (client accepted), rejected (client declined), expired (no longer valid), void (cancelled/invalid)';
