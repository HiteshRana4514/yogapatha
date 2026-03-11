-- Add missing columns to trainer_payment_details table
-- Run this in Supabase SQL Editor

-- Add rejection_reason column if it doesn't exist
ALTER TABLE trainer_payment_details 
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add verified_at column if it doesn't exist
ALTER TABLE trainer_payment_details 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add verified_by column if it doesn't exist
ALTER TABLE trainer_payment_details 
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Rename notes to admin_notes if notes exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainer_payment_details' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE trainer_payment_details RENAME COLUMN notes TO admin_notes;
  END IF;
END $$;

-- Add admin_notes if it doesn't exist (in case notes didn't exist either)
ALTER TABLE trainer_payment_details 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Verify columns now exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trainer_payment_details'
ORDER BY ordinal_position;
