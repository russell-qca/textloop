-- Migration: Refactor leads into clients, quotes, and projects
-- This migration separates the monolithic leads table into three distinct entities

-- Step 1: Create the new clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_address_street TEXT,
  client_address_city TEXT,
  client_address_state TEXT,
  client_address_zip TEXT,
  client_address_unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 2: Create the new quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_amount DECIMAL(10, 2) NOT NULL,
  date_quoted DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 3: Create the new projects table (independent from quotes)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL,
  project_description TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  project_cost DECIMAL(10, 2),
  permits_required BOOLEAN NOT NULL DEFAULT false,
  permit_status TEXT CHECK (permit_status IN ('pending', 'approved', 'rejected', 'not_applicable')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 4: Migrate existing data from leads to new tables
-- First, create clients from unique leads
INSERT INTO clients (id, contractor_id, client_name, client_phone, client_address_street,
                     client_address_city, client_address_state, client_address_zip,
                     client_address_unit, created_at, updated_at)
SELECT DISTINCT ON (contractor_id, client_phone)
  uuid_generate_v4(),
  contractor_id,
  client_name,
  client_phone,
  client_address_street,
  client_address_city,
  client_address_state,
  client_address_zip,
  client_address_unit,
  created_at,
  updated_at
FROM leads
ORDER BY contractor_id, client_phone, created_at;

-- Then, create quotes from leads
-- We'll need to link them to the newly created clients
WITH client_mapping AS (
  SELECT
    l.id as lead_id,
    c.id as client_id
  FROM leads l
  JOIN clients c ON
    c.contractor_id = l.contractor_id AND
    c.client_phone = l.client_phone
)
INSERT INTO quotes (id, contractor_id, client_id, quote_amount, date_quoted, status, created_at, updated_at)
SELECT
  l.id, -- Keep the same ID for message references
  l.contractor_id,
  cm.client_id,
  COALESCE(l.quote_amount, 0),
  l.date_quoted,
  CASE
    WHEN l.status = 'won' THEN 'accepted'
    WHEN l.status = 'lost' THEN 'rejected'
    ELSE 'pending'
  END,
  l.created_at,
  l.updated_at
FROM leads l
JOIN client_mapping cm ON cm.lead_id = l.id;

-- Step 5: Update messages table to reference either quotes or projects
-- First, rename lead_id to quote_id and make it nullable
ALTER TABLE messages RENAME COLUMN lead_id TO quote_id;
ALTER TABLE messages DROP CONSTRAINT messages_lead_id_fkey;

-- Add nullable foreign keys for both quotes and projects
ALTER TABLE messages ALTER COLUMN quote_id DROP NOT NULL;
ALTER TABLE messages ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraint for quote_id
ALTER TABLE messages ADD CONSTRAINT messages_quote_id_fkey
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- Add a check constraint to ensure exactly one of quote_id or project_id is set
ALTER TABLE messages ADD CONSTRAINT messages_reference_check
  CHECK (
    (quote_id IS NOT NULL AND project_id IS NULL) OR
    (quote_id IS NULL AND project_id IS NOT NULL)
  );

-- Step 6: Update indexes
DROP INDEX IF EXISTS idx_leads_contractor_id;
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_messages_lead_id;

CREATE INDEX idx_clients_contractor_id ON clients(contractor_id);
CREATE INDEX idx_clients_phone ON clients(client_phone);
CREATE INDEX idx_quotes_contractor_id ON quotes(contractor_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_projects_contractor_id ON projects(contractor_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_messages_quote_id ON messages(quote_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);

-- Step 7: Drop the old leads table
DROP TABLE leads;

-- Step 8: Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable RLS on new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for clients
CREATE POLICY "Contractors can view own clients"
  ON clients FOR SELECT
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid()::text = contractor_id::text);

-- Step 11: Create RLS policies for quotes
CREATE POLICY "Contractors can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can insert own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can delete own quotes"
  ON quotes FOR DELETE
  USING (auth.uid()::text = contractor_id::text);

-- Step 12: Create RLS policies for projects
CREATE POLICY "Contractors can view own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = contractor_id::text);

-- Step 13: Update RLS policies for messages to handle both quotes and projects
DROP POLICY IF EXISTS "Contractors can view own messages" ON messages;
DROP POLICY IF EXISTS "Contractors can insert messages for own leads" ON messages;
DROP POLICY IF EXISTS "Contractors can update messages for own leads" ON messages;

CREATE POLICY "Contractors can view own messages"
  ON messages FOR SELECT
  USING (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = messages.quote_id
      AND quotes.contractor_id::text = auth.uid()::text
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.contractor_id::text = auth.uid()::text
    ))
  );

CREATE POLICY "Contractors can insert messages for own quotes and projects"
  ON messages FOR INSERT
  WITH CHECK (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = messages.quote_id
      AND quotes.contractor_id::text = auth.uid()::text
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.contractor_id::text = auth.uid()::text
    ))
  );

CREATE POLICY "Contractors can update messages for own quotes and projects"
  ON messages FOR UPDATE
  USING (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = messages.quote_id
      AND quotes.contractor_id::text = auth.uid()::text
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.contractor_id::text = auth.uid()::text
    ))
  );

-- Step 14: Add helpful comments
COMMENT ON TABLE clients IS 'Stores client/customer information separate from quotes and projects';
COMMENT ON TABLE quotes IS 'Stores quotes sent to clients - can have multiple quotes per client';
COMMENT ON TABLE projects IS 'Stores projects for clients - independent from quotes';
COMMENT ON TABLE messages IS 'Stores SMS messages that can be linked to either quotes or projects';
COMMENT ON COLUMN messages.quote_id IS 'References a quote (mutually exclusive with project_id)';
COMMENT ON COLUMN messages.project_id IS 'References a project (mutually exclusive with quote_id)';
COMMENT ON COLUMN projects.permits_required IS 'Whether this project requires permits';
COMMENT ON COLUMN projects.permit_status IS 'Status of permits if required';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending (awaiting response), accepted (client accepted), rejected (client declined), expired (no longer valid)';
COMMENT ON COLUMN projects.status IS 'Project status: planned (scheduled), active (in progress), completed (finished), cancelled (not proceeding)';
