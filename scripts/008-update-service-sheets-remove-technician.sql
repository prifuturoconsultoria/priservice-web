-- Remove technician_name column from service_sheets table
-- since we now get this info from the user profile
ALTER TABLE service_sheets 
DROP COLUMN IF EXISTS technician_name;