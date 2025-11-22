-- Add lead tracking fields to clients table

-- Add lead_date column (when client originally contacted us)
ALTER TABLE clients
ADD COLUMN lead_date DATE;

-- Add lead_origin column with check constraint
ALTER TABLE clients
ADD COLUMN lead_origin TEXT;

ALTER TABLE clients
ADD CONSTRAINT clients_lead_origin_check
CHECK (lead_origin IN ('Direct', 'Angis', 'Thumbtack', 'Referral'));

-- Add visit_date column (when we visited the client)
ALTER TABLE clients
ADD COLUMN visit_date DATE;

-- Add status column with check constraint
ALTER TABLE clients
ADD COLUMN status TEXT DEFAULT 'lead';

ALTER TABLE clients
ADD CONSTRAINT clients_status_check
CHECK (status IN ('lead', 'active', 'archived'));

-- Add comments for documentation
COMMENT ON COLUMN clients.lead_date IS 'Date when the client originally contacted us';
COMMENT ON COLUMN clients.lead_origin IS 'Source of the lead: Direct, Angis, Thumbtack, or Referral';
COMMENT ON COLUMN clients.visit_date IS 'Date when we visited the client';
COMMENT ON COLUMN clients.status IS 'Client status: lead (new prospect), active (current client), archived (past client)';
