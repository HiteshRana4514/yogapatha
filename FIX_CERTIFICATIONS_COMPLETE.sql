-- ============================================================================
-- FIX CERTIFICATIONS DISPLAY AND UPDATE ISSUES
-- ============================================================================
-- This script fixes two issues:
-- 1. Certifications not visible in admin panel (missing column)
-- 2. RLS policy blocking trainers from updating their profile
-- ============================================================================
--
-- IMPORTANT: The database has 'certificate_documents' for files only.
-- This adds a NEW 'certifications' column for certification names + URLs.
--
-- Structure:
-- - certificate_documents: JSONB array of uploaded files (already exists)
-- - certifications: JSONB array of {name, url} objects (NEW - being added)
-- ============================================================================

-- STEP 1: Add certifications column to trainer_profiles
-- ============================================================================

-- Add the certifications column (JSONB array) if it doesn't exist
ALTER TABLE trainer_profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN trainer_profiles.certifications IS 'Array of certification objects with structure: [{name: string, url: string}]. Example: [{"name": "Yoga Alliance RYT-200", "url": "https://cloudinary.com/cert.pdf"}]';

-- Drop existing constraint if it exists (to avoid conflicts)
ALTER TABLE trainer_profiles
DROP CONSTRAINT IF EXISTS certifications_is_array;

-- Add a check constraint to ensure it's an array
ALTER TABLE trainer_profiles
ADD CONSTRAINT certifications_is_array
CHECK (jsonb_typeof(certifications) = 'array');

-- STEP 2: Fix RLS policies for trainer_profiles to allow UPSERT
-- ============================================================================
-- The issue: UPSERT requires both INSERT and UPDATE permissions
-- When admin creates a trainer_profile, trainers can't update it via UPSERT
-- because the old UPDATE policy had a WITH CHECK clause that was too restrictive

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
-- Removed WITH CHECK clause to allow updates even if profile was created by admin
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- STEP 3: Verify the changes
-- ============================================================================

-- Check if certifications column exists and is JSONB
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'trainer_profiles' 
  AND column_name = 'certifications';

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'trainer_profiles'
  AND policyname LIKE '%Trainers%'
ORDER BY policyname;

-- STEP 4: Optional - Migrate existing certifications from user_metadata
-- ============================================================================
-- This is commented out by default. Uncomment if you want to migrate
-- existing certifications from auth.users.user_metadata to trainer_profiles

/*
-- Update trainer_profiles with certifications from user_metadata
UPDATE trainer_profiles tp
SET certifications = CASE
  -- If user_metadata has certifications as a string, convert to array
  WHEN u.raw_user_meta_data->>'certifications' IS NOT NULL 
    AND u.raw_user_meta_data->>'certifications' != '' THEN
    -- Convert comma-separated string to array of objects
    (
      SELECT jsonb_agg(
        jsonb_build_object('name', trim(cert), 'url', null)
      )
      FROM unnest(
        string_to_array(u.raw_user_meta_data->>'certifications', ',')
      ) AS cert
      WHERE trim(cert) != ''
    )
  ELSE '[]'::jsonb
END
FROM auth.users u
WHERE tp.user_id = u.id
  AND (tp.certifications IS NULL OR tp.certifications = '[]'::jsonb)
  AND u.raw_user_meta_data->>'certifications' IS NOT NULL
  AND u.raw_user_meta_data->>'certifications' != '';
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count trainers with certifications
SELECT 
  COUNT(*) as total_trainers,
  COUNT(CASE WHEN certifications != '[]'::jsonb THEN 1 END) as trainers_with_certs
FROM trainer_profiles;

-- Show sample certifications data
SELECT 
  user_id,
  certifications,
  certificate_documents
FROM trainer_profiles
WHERE certifications != '[]'::jsonb
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Certifications fix completed successfully!';
  RAISE NOTICE '1. certifications column added/verified';
  RAISE NOTICE '2. RLS policies updated to allow UPSERT';
  RAISE NOTICE '3. Trainers can now update their certifications';
  RAISE NOTICE '4. Admin can view all certifications';
END $$;

