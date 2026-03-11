-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

-- Create a more permissive insert policy
-- Allow any authenticated user to insert notifications (admins assigning clients)
CREATE POLICY "Allow authenticated users to insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify the table exists and check current policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';
