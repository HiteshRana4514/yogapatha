-- Create trainer_profiles entries for users with role='trainer' who don't have one yet
-- This ensures all trainers have a complete profile

-- Insert missing trainer_profiles
INSERT INTO trainer_profiles (user_id, kyc_status, wants_partnership)
SELECT 
  up.id,
  'pending',  -- Default KYC status
  false       -- Default wants_partnership
FROM user_profiles up
WHERE up.role = 'trainer'
  AND NOT EXISTS (
    SELECT 1 FROM trainer_profiles tp WHERE tp.user_id = up.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Verify the results
SELECT 
  'Total trainers in user_profiles' as description,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'trainer'
UNION ALL
SELECT 
  'Total trainer_profiles entries' as description,
  COUNT(*) as count
FROM trainer_profiles
UNION ALL
SELECT 
  'Trainers without trainer_profiles' as description,
  COUNT(*) as count
FROM user_profiles up
WHERE up.role = 'trainer'
  AND NOT EXISTS (
    SELECT 1 FROM trainer_profiles tp WHERE tp.user_id = up.id
  );

-- Show all trainers with their profile status
SELECT 
  up.id as user_id,
  up.first_name,
  up.last_name,
  up.email,
  up.role,
  CASE 
    WHEN tp.id IS NOT NULL THEN 'Has trainer_profile'
    ELSE 'Missing trainer_profile'
  END as profile_status,
  tp.kyc_status
FROM user_profiles up
LEFT JOIN trainer_profiles tp ON tp.user_id = up.id
WHERE up.role = 'trainer'
ORDER BY up.created_at DESC;

