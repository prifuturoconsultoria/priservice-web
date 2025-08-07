CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  client_responsible TEXT NOT NULL,
  partner_responsible TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view all projects" ON projects
  FOR SELECT USING (true);
CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete projects" ON projects
  FOR DELETE USING (true);

-- Update service_sheets table to reference projects
ALTER TABLE service_sheets 
ADD COLUMN project_id UUID REFERENCES projects(id),
DROP COLUMN project_name,
DROP COLUMN client_company;

-- Add index for better performance
CREATE INDEX idx_service_sheets_project_id ON service_sheets(project_id);