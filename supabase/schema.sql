-- TextLoop Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contractors Table
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  twilio_phone_number TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_address_street TEXT,
  client_address_city TEXT,
  client_address_state TEXT,
  client_address_zip TEXT,
  client_address_unit TEXT,
  project_type TEXT NOT NULL,
  quote_amount DECIMAL(10, 2),
  date_quoted DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sequence_day INTEGER NOT NULL CHECK (sequence_day IN (1, 3, 5, 8, 12)),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better query performance
CREATE INDEX idx_leads_contractor_id ON leads(contractor_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_scheduled_for ON messages(scheduled_for);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Contractors can only see their own data
CREATE POLICY "Contractors can view own data"
  ON contractors FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Contractors can insert own data"
  ON contractors FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Contractors can update own data"
  ON contractors FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Contractors can only see their own leads
CREATE POLICY "Contractors can view own leads"
  ON leads FOR SELECT
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can update own leads"
  ON leads FOR UPDATE
  USING (auth.uid()::text = contractor_id::text);

CREATE POLICY "Contractors can delete own leads"
  ON leads FOR DELETE
  USING (auth.uid()::text = contractor_id::text);

-- Contractors can only see messages for their leads
CREATE POLICY "Contractors can view own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
      AND leads.contractor_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Contractors can insert messages for own leads"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
      AND leads.contractor_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Contractors can update messages for own leads"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
      AND leads.contractor_id::text = auth.uid()::text
    )
  );

-- Comments for documentation
COMMENT ON TABLE contractors IS 'Stores contractor user information and subscription status';
COMMENT ON TABLE leads IS 'Stores lead/client information for follow-up campaigns';
COMMENT ON TABLE messages IS 'Stores scheduled and sent SMS messages for each lead';

COMMENT ON COLUMN messages.sequence_day IS 'Day in the follow-up sequence: 1, 3, 5, 8, or 12';
COMMENT ON COLUMN leads.status IS 'Lead status: active (in follow-up), won (job secured), or lost (not interested)';
COMMENT ON COLUMN contractors.subscription_status IS 'Subscription status: active (paid), inactive (trial/expired), cancelled';
