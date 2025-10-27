-- This script is no longer needed as hours are calculated in application code
-- The application will:
-- 1. Calculate hours from start_time and end_time difference
-- 2. Validate against project's available hours
-- 3. Update project's used_hours directly in the application code
-- 4. No database column or trigger needed for hours_logged in service_sheets

-- Note: Hours tracking is only in the projects table (total_hours and used_hours)
-- Service sheets only store start_time and end_time
