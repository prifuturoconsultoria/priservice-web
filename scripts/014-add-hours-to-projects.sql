-- Add hour tracking columns to projects table
ALTER TABLE projects
ADD COLUMN total_hours DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (total_hours >= 0),
ADD COLUMN used_hours DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (used_hours >= 0 AND used_hours <= total_hours);

-- Add comment to explain the columns
COMMENT ON COLUMN projects.total_hours IS 'Total hours allocated to this project';
COMMENT ON COLUMN projects.used_hours IS 'Hours already used/logged on service sheets for this project';

-- Create an index for performance when querying available hours
CREATE INDEX idx_projects_hours ON projects(total_hours, used_hours);
