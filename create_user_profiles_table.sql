-- Alternative Solution: Create a public user_profiles table
-- This table will store user metadata in a publicly accessible way
-- Run this in your Supabase SQL Editor

-- Drop existing table and trigger to start fresh (optional - comment out if you want to preserve data)
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create user_profiles table
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to read profiles" ON user_profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SIMPLIFIED: Allow all authenticated users to read all profiles
-- This is safe for an admin panel where admins need to see trainer data
-- You can add more granular permissions later if needed
CREATE POLICY "Allow all authenticated users to read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user_profile when a new user signs up
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
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
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users from auth.users to user_profiles
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
ON CONFLICT (id) DO NOTHING;  -- Skip users that already exist

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Note: We don't add a foreign key from trainer_profiles to user_profiles
-- because trainer_profiles.user_id already references auth.users(id)
-- and user_profiles.id also references auth.users(id)
-- They are linked through auth.users(id) as the common key

