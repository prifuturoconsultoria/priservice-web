-- Fix observer access to profiles table
-- Observers need to see profile information of service sheet creators

-- Allow observers to view all profiles (read-only)
CREATE POLICY "Observers can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'observer'
    )
  );