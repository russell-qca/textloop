-- Migration: Add multi-user support with role-based permissions
-- This allows multiple users to access the same contractor's data with different permission levels

-- Step 1: Create users table to link auth users to contractors
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(id) -- Each auth user can only belong to one contractor
);

-- Step 2: Create index for performance
CREATE INDEX idx_users_contractor_id ON users(contractor_id);
CREATE INDEX idx_users_id ON users(id);

-- Step 3: Populate users table with existing contractors as owners
-- Every contractor row represents an owner user
INSERT INTO users (id, contractor_id, role)
SELECT id, id, 'owner'
FROM contractors;

-- Step 4: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for users table
-- Users can view other users in their contractor team
CREATE POLICY "Team members can view their team"
  ON users FOR SELECT
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users WHERE id = auth.uid()
    )
  );

-- Only owners and admins can insert new team members
CREATE POLICY "Owners and admins can add team members"
  ON users FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can update team members (e.g., change roles)
CREATE POLICY "Owners and admins can update team members"
  ON users FOR UPDATE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete team members
CREATE POLICY "Owners can delete team members"
  ON users FOR DELETE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Step 6: Update RLS policies for contractors table
DROP POLICY IF EXISTS "Users can view own profile" ON contractors;
DROP POLICY IF EXISTS "Users can update own profile" ON contractors;

CREATE POLICY "Team members can view contractor profile"
  ON contractors FOR SELECT
  USING (
    id IN (
      SELECT contractor_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can update contractor profile"
  ON contractors FOR UPDATE
  USING (
    id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Step 7: Update RLS policies for clients
DROP POLICY IF EXISTS "Contractors can view own clients" ON clients;
DROP POLICY IF EXISTS "Contractors can insert own clients" ON clients;
DROP POLICY IF EXISTS "Contractors can update own clients" ON clients;
DROP POLICY IF EXISTS "Contractors can delete own clients" ON clients;

-- All team members can view clients
CREATE POLICY "Team members can view clients"
  ON clients FOR SELECT
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users WHERE id = auth.uid()
    )
  );

-- Members, admins, and owners can create clients (not viewers)
CREATE POLICY "Team members with write access can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Members, admins, and owners can update clients (not viewers)
CREATE POLICY "Team members with write access can update clients"
  ON clients FOR UPDATE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Only owners and admins can delete clients
CREATE POLICY "Owners and admins can delete clients"
  ON clients FOR DELETE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Step 8: Update RLS policies for quotes
DROP POLICY IF EXISTS "Contractors can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Contractors can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Contractors can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Contractors can delete own quotes" ON quotes;

CREATE POLICY "Team members can view quotes"
  ON quotes FOR SELECT
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members with write access can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Team members with write access can update quotes"
  ON quotes FOR UPDATE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Owners and admins can delete quotes"
  ON quotes FOR DELETE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Step 9: Update RLS policies for projects
DROP POLICY IF EXISTS "Contractors can view own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can insert own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can update own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can delete own projects" ON projects;

CREATE POLICY "Team members can view projects"
  ON projects FOR SELECT
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members with write access can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Team members with write access can update projects"
  ON projects FOR UPDATE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Owners and admins can delete projects"
  ON projects FOR DELETE
  USING (
    contractor_id IN (
      SELECT contractor_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Step 10: Update RLS policies for messages
DROP POLICY IF EXISTS "Contractors can view own messages" ON messages;
DROP POLICY IF EXISTS "Contractors can insert messages for own quotes and projects" ON messages;
DROP POLICY IF EXISTS "Contractors can update messages for own quotes and projects" ON messages;

CREATE POLICY "Team members can view messages"
  ON messages FOR SELECT
  USING (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes q
      JOIN users u ON u.contractor_id = q.contractor_id
      WHERE q.id = messages.quote_id
      AND u.id = auth.uid()
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.contractor_id = p.contractor_id
      WHERE p.id = messages.project_id
      AND u.id = auth.uid()
    ))
  );

CREATE POLICY "Team members with write access can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes q
      JOIN users u ON u.contractor_id = q.contractor_id
      WHERE q.id = messages.quote_id
      AND u.id = auth.uid()
      AND u.role IN ('owner', 'admin', 'member')
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.contractor_id = p.contractor_id
      WHERE p.id = messages.project_id
      AND u.id = auth.uid()
      AND u.role IN ('owner', 'admin', 'member')
    ))
  );

CREATE POLICY "Team members with write access can update messages"
  ON messages FOR UPDATE
  USING (
    (messages.quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes q
      JOIN users u ON u.contractor_id = q.contractor_id
      WHERE q.id = messages.quote_id
      AND u.id = auth.uid()
      AND u.role IN ('owner', 'admin', 'member')
    ))
    OR
    (messages.project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.contractor_id = p.contractor_id
      WHERE p.id = messages.project_id
      AND u.id = auth.uid()
      AND u.role IN ('owner', 'admin', 'member')
    ))
  );

-- Step 11: Create trigger for updated_at on users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Add helpful comments
COMMENT ON TABLE users IS 'Links auth users to contractors with role-based permissions';
COMMENT ON COLUMN users.role IS 'User role: owner (full access, can manage team), admin (full access to data, can manage team), member (can create/edit data), viewer (read-only access)';
COMMENT ON COLUMN users.contractor_id IS 'The contractor/company this user belongs to';
