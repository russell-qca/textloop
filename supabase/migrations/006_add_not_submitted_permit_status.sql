-- Migration: Add 'not_submitted' permit status
-- This allows tracking permits that are required but haven't been submitted yet

-- Drop the existing check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_permit_status_check;

-- Add the new check constraint with 'not_submitted' status
ALTER TABLE projects ADD CONSTRAINT projects_permit_status_check
  CHECK (permit_status IN ('pending', 'approved', 'rejected', 'not_applicable', 'not_submitted'));

-- Update the comment
COMMENT ON COLUMN projects.permit_status IS 'Status of permits if required: not_submitted (required but not yet submitted), pending (submitted, awaiting approval), approved (permit granted), rejected (permit denied), not_applicable (no permits required)';
