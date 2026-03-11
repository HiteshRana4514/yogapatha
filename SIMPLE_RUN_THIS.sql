-- ========================================
-- SIMPLE SETUP - JUST RUN THIS!
-- ========================================
-- This script is safe to run multiple times
-- It will update everything without errors

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Step 2: Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  
  -- Professional Information (for trainers)
  bio TEXT,
  experience TEXT,
  specializations JSONB DEFAULT '[]'::jsonb,
  certifications TEXT,
  
  -- Role
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'trainer', 'admin')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, first_name, last_name, phone, bio, experience, specializations, certifications, address, city, state, pincode)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'experience',
    COALESCE(NEW.raw_user_meta_data->'specializations', '[]'::jsonb),
    NEW.raw_user_meta_data->>'certifications',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'pincode'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Migrate existing users
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, bio, experience, specializations, certifications, address, city, state, pincode)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'role', 'client'),
  u.raw_user_meta_data->>'firstName',
  u.raw_user_meta_data->>'lastName',
  u.raw_user_meta_data->>'phone',
  u.raw_user_meta_data->>'bio',
  u.raw_user_meta_data->>'experience',
  COALESCE(u.raw_user_meta_data->'specializations', '[]'::jsonb),
  u.raw_user_meta_data->>'certifications',
  u.raw_user_meta_data->>'address',
  u.raw_user_meta_data->>'city',
  u.raw_user_meta_data->>'state',
  u.raw_user_meta_data->>'pincode'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = u.id
);

-- Step 10: Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- ========================================
-- VERIFICATION
-- ========================================
-- Check results
SELECT 
  'user_profiles table' as item,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'RLS policies' as item,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Done! You should see:
-- - user_profiles table: [number of users]
-- - RLS policies: 5

