-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;

-- Create more permissive policies
CREATE POLICY "Anyone can view active team members"
  ON team_members
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can do everything"
  ON team_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'team_members';
