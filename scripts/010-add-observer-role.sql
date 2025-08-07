-- Add observer role to profiles table
ALTER TABLE profiles 
DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'technician', 'observer'));

-- Update the default role to remain as technician
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'technician';

-- Create additional policy for observers to view service sheets
CREATE POLICY "Observers can view all service sheets" ON service_sheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'observer'
    )
  );

-- Create policy for observers to view all projects  
CREATE POLICY "Observers can view all projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'observer'
    )
  );