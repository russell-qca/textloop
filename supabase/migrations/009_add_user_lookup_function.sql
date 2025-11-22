-- Create a function to look up users by email
-- This is needed for inviting team members by email address

CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (id UUID, email TEXT)
SECURITY DEFINER -- This allows the function to access auth.users
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

COMMENT ON FUNCTION get_user_by_email IS 'Looks up a user by email address. Used for team member invitations.';
