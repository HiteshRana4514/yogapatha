-- Fix RLS policies for clients table
-- The issue: policies check trainer_id = auth.uid()
-- But clients.trainer_id stores trainer_profiles.id, not user_id

-- Drop existing policies
DROP POLICY IF EXISTS "Trainers can read own clients" ON clients;
DROP POLICY IF EXISTS "Trainers can create clients" ON clients;
DROP POLICY IF EXISTS "Trainers can update own clients" ON clients;

-- Create new policies that check trainer_profiles
-- Policy: Trainers can read their own clients
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

