-- Verify and fix RLS policies for trainer_payment_details
-- Run this in Supabase SQL Editor

-- First, check what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'trainer_payment_details';

-- Drop all existing policies
DROP POLICY IF EXISTS "Trainers manage own payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins view all payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins verify payment details" ON trainer_payment_details;

-- Recreate with better policies
-- Trainers can insert and update their own details
CREATE POLICY "Trainers manage own payment details"
  ON trainer_payment_details FOR ALL
  USING (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()));

-- Admins can view all
CREATE POLICY "Admins view all payment details"
  ON trainer_payment_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all (for verification)
CREATE POLICY "Admins update payment details"
  ON trainer_payment_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'trainer_payment_details';
