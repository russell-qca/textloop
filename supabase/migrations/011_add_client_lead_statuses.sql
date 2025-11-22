-- Add lead/scheduled and lead/quote statuses to clients table
-- Migration: 011

-- Drop the existing status constraint
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_status_check;

-- Add new status constraint with additional status values
ALTER TABLE clients
ADD CONSTRAINT clients_status_check
CHECK (status IN ('lead', 'active', 'archived', 'lead/scheduled', 'lead/quote'));

-- Update comment for documentation
COMMENT ON COLUMN clients.status IS 'Client status: lead (new prospect), active (current client), archived (past client), lead/scheduled (visit scheduled), lead/quote (quote provided)';
