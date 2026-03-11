-- ============================================================================
-- FIX RLS POLICY FOR TRAINER_PROFILES
-- ============================================================================
-- This fixes the RLS policy error when trainers try to update their profile
-- Error: "new row violates row-level security policy for table trainer_profiles"
-- ============================================================================

-- The issue: UPSERT requires both INSERT and UPDATE permissions
-- The old UPDATE policy had a WITH CHECK clause that blocked updates
-- when the profile was created by admin

-- Drop existing trainer UPDATE policy
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer_profiles;

-- Recreate UPDATE policy without WITH CHECK clause
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: Removed the WITH CHECK clause
-- This allows trainers to update their profile even if it was created by admin
-- The USING clause ensures they can only update their own profile (security maintained)

-- Verify the policy was created correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'trainer_profiles'
  AND policyname = 'Trainers can update own profile';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policy fixed successfully!';
  RAISE NOTICE 'Trainers can now update their profiles via UPSERT';
END $$;

