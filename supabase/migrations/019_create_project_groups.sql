-- Create project_groups table for work crews
-- Migration: 019

-- Create project_groups table
CREATE TABLE project_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on contractor_id for faster queries
CREATE INDEX idx_project_groups_contractor_id ON project_groups(contractor_id);

-- Enable Row Level Security
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Contractors can view their own project groups"
  ON project_groups FOR SELECT
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can insert their own project groups"
  ON project_groups FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their own project groups"
  ON project_groups FOR UPDATE
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete their own project groups"
  ON project_groups FOR DELETE
  USING (contractor_id = auth.uid());

-- Add comments
COMMENT ON TABLE project_groups IS 'Work crews/groups for organizing projects';
COMMENT ON COLUMN project_groups.name IS 'Name of the work crew/group';
COMMENT ON COLUMN project_groups.color IS 'Hex color code for calendar display (e.g., #3b82f6)';
