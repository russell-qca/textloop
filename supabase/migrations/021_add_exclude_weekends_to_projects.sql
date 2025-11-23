-- Add exclude_weekends column to projects table
ALTER TABLE projects
ADD COLUMN exclude_weekends BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN projects.exclude_weekends IS 'When true, calendar display will skip weekends (show gaps on Saturday and Sunday)';
