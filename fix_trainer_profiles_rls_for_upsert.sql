-- Fix RLS policies for trainer_profiles to allow UPSERT operations
-- The issue: UPSERT requires both INSERT and UPDATE permissions
-- When admin creates a trainer_profile, trainers can't update it via UPSERT
-- because the INSERT policy fails (profile already exists)

-- Solution: Make the policies more permissive for trainers updating their own data

-- Drop existing trainer policies
DROP POLICY IF EXISTS "Trainers can read own profile" ON trainer_profiles;
DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer_profiles;
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer_profiles;

-- Recreate policies with better UPSERT support

-- Policy: Trainers can read their own profile
CREATE POLICY "Trainers can read own profile"
  ON trainer_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Trainers can insert their own profile
-- This allows UPSERT to work even if profile was created by admin
CREATE POLICY "Trainers can insert own profile"
  ON trainer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Trainers can update their own profile
-- Allow trainers to update any fields in their profile
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: Removed the WITH CHECK clause from UPDATE policy
-- This allows trainers to update their profile even if it was created by admin
-- The USING clause ensures they can only update their own profile

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'trainer_profiles'
ORDER BY policyname;

