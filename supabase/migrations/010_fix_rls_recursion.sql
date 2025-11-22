-- Fix infinite recursion in RLS policies by using security definer functions

-- Create a function to get the current user's contractor_id
-- This avoids the recursion problem by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_current_user_contractor_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contractor_id_result UUID;
BEGIN
  SELECT contractor_id INTO contractor_id_result
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN contractor_id_result;
END;
$$;

-- Create a function to check if current user has a specific role
CREATE OR REPLACE FUNCTION current_user_has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN user_role = ANY(required_roles);
END;
$$;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Team members can view their team" ON users;
DROP POLICY IF EXISTS "Owners and admins can insert team members" ON users;
DROP POLICY IF EXISTS "Owners and admins can update team members" ON users;
DROP POLICY IF EXISTS "Owners can delete team members" ON users;

-- Recreate policies using the helper functions to avoid recursion
CREATE POLICY "Team members can view their team"
  ON users FOR SELECT
  USING (
    id = auth.uid()  -- Can always see yourself
    OR
    contractor_id = get_current_user_contractor_id()  -- Can see team members
  );

CREATE POLICY "Owners and admins can insert team members"
  ON users FOR INSERT
  WITH CHECK (
    contractor_id = get_current_user_contractor_id()
    AND
    current_user_has_role(ARRAY['owner', 'admin'])
  );

CREATE POLICY "Owners and admins can update team members"
  ON users FOR UPDATE
  USING (
    contractor_id = get_current_user_contractor_id()
    AND
    current_user_has_role(ARRAY['owner', 'admin'])
  );

CREATE POLICY "Owners can delete team members"
  ON users FOR DELETE
  USING (
    contractor_id = get_current_user_contractor_id()
    AND
    current_user_has_role(ARRAY['owner'])
  );
