-- Add group_id to projects table
-- Migration: 020

-- Add group_id column (nullable - projects can be unassigned)
ALTER TABLE projects
ADD COLUMN group_id UUID REFERENCES project_groups(id) ON DELETE SET NULL;

-- Create index for faster filtering by group
CREATE INDEX idx_projects_group_id ON projects(group_id);

-- Add comment
COMMENT ON COLUMN projects.group_id IS 'Work crew/group assignment (nullable - unassigned projects appear in light gray on calendar)';
