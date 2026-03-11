-- Trainer Profiles Table
-- This table stores only verification documents and partnership info
-- All other data (name, phone, bio, etc.) is stored in auth.users.user_metadata

-- Drop existing table if you want to recreate (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS trainer_profiles CASCADE;

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile Media (required for all trainers)
  avatar_url TEXT,
  
  -- Verification Documents (required for all trainers)
  identity_card_url TEXT, -- Government ID required for all
  certificate_documents JSONB DEFAULT '[]'::jsonb, -- Certificates required for all
  
  -- KYC Status (for all trainers - managed by admin)
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT, -- For admin to add notes about verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified

  -- Account Status (managed by admin)
  is_active BOOLEAN DEFAULT TRUE, -- Trainer can login only if active
  
  -- Partnership Information (optional for trainers who want to be partners)
  wants_partnership BOOLEAN DEFAULT FALSE,
  academy_name TEXT, -- Only if wants_partnership = true
  academy_address TEXT, -- Only if wants_partnership = true
  academy_logo_url TEXT, -- Only if wants_partnership = true
  partnership_status TEXT CHECK (partnership_status IN ('pending', 'approved', 'rejected')), -- Separate from KYC
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_kyc_status ON trainer_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_partnership_status ON trainer_profiles(partnership_status);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_wants_partnership ON trainer_profiles(wants_partnership);

-- Enable Row Level Security
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can read their own profile
CREATE POLICY "Trainers can read own profile"
  ON trainer_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Trainers can insert their own profile
CREATE POLICY "Trainers can insert own profile"
  ON trainer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Trainers can update their own profile
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can read all trainer profiles
CREATE POLICY "Admins can read all profiles"
  ON trainer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update partnership status and verification
CREATE POLICY "Admins can update verification status"
  ON trainer_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: File storage is handled by Cloudinary
-- All file URLs (avatar_url, identity_card_url, academy_logo_url, certificate_documents)
-- will store Cloudinary URLs instead of Supabase storage URLs

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on trainer_profiles
CREATE TRIGGER update_trainer_profiles_updated_at
  BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  trainer_id UUID REFERENCES trainer_profiles(id) ON DELETE SET NULL,
  class_type TEXT DEFAULT NULL CHECK (class_type IN ('demo', 'permanent', NULL))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can read their own clients
-- Note: clients.trainer_id stores trainer_profiles.id, not user_id
CREATE POLICY "Trainers can read own clients"
  ON clients FOR SELECT
  USING (
    trainer_id::uuid IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Trainers can create clients
CREATE POLICY "Trainers can create clients"
  ON clients FOR INSERT
  WITH CHECK (
    trainer_id::uuid IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Trainers can update their own clients
CREATE POLICY "Trainers can update own clients"
  ON clients FOR UPDATE
  USING (
    trainer_id::uuid IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trainer_id::uuid IN (
      SELECT id FROM trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can read all clients
CREATE POLICY "Admins can read all clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update all clients
CREATE POLICY "Admins can update all clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at on clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample query to get trainer profile with user info
-- SELECT 
--   tp.*,
--   u.email,
--   u.raw_user_meta_data->>'firstName' as first_name,
--   u.raw_user_meta_data->>'lastName' as last_name
-- FROM trainer_profiles tp
-- JOIN auth.users u ON tp.user_id = u.id
-- WHERE tp.user_id = 'user-id-here';
