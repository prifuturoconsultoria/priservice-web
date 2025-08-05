-- Function to get user email from auth.users table
-- This function runs with SECURITY DEFINER to access auth schema
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO anon;