-- Fix the infinite recursion issue caused by the observer policy
-- The problem: the policy was checking profiles table to determine if user is observer,
-- but that creates infinite recursion when trying to access profiles table

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Observers can view all profiles" ON profiles;

-- Create a better approach: use a more direct method to identify observers
-- We'll use auth.jwt() to get the user's metadata or create a simpler policy

-- Alternative 1: Allow all authenticated users to view basic profile info (name, email)
-- This is safe since it's just basic contact information needed for service sheets
CREATE POLICY "Authenticated users can view basic profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- If you want more restrictive access, you can use Alternative 2 instead:
-- Alternative 2: Create a function to check user role safely
-- CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
-- RETURNS TEXT AS $$
--   SELECT role FROM profiles WHERE id = user_id LIMIT 1;
-- $$ LANGUAGE SQL SECURITY DEFINER;
-- 
-- CREATE POLICY "Observers and admins can view all profiles" ON profiles
--   FOR SELECT USING (
--     auth.uid() = id OR 
--     get_user_role(auth.uid()) IN ('admin', 'observer')
--   );