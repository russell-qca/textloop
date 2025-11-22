-- Create inspections table for tracking permit inspections
-- Migration: 012

-- Create inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('footer', 'framing', 'electrical', 'plumbing', 'insulation', 'final')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(project_id, inspection_type)
);

-- Create index for better query performance
CREATE INDEX idx_inspections_project_id ON inspections(project_id);
CREATE INDEX idx_inspections_completed ON inspections(completed);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Contractors can only see inspections for their own projects
CREATE POLICY "Contractors can view own project inspections"
  ON inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = inspections.project_id
      AND projects.contractor_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Contractors can insert inspections for own projects"
  ON inspections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = inspections.project_id
      AND projects.contractor_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Contractors can update inspections for own projects"
  ON inspections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = inspections.project_id
      AND projects.contractor_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Contractors can delete inspections for own projects"
  ON inspections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = inspections.project_id
      AND projects.contractor_id::text = auth.uid()::text
    )
  );

-- Add comments for documentation
COMMENT ON TABLE inspections IS 'Tracks permit inspections for projects';
COMMENT ON COLUMN inspections.inspection_type IS 'Type of inspection: footer, framing, electrical, plumbing, insulation, final';
COMMENT ON COLUMN inspections.completed IS 'Whether the inspection has been completed';
COMMENT ON COLUMN inspections.completed_date IS 'Date when the inspection was completed';
