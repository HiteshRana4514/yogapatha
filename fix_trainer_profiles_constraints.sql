-- Fix trainer_profiles table to allow NULL values for identity_card_url
-- This allows admin to create trainers without requiring documents upfront
-- Trainers can upload documents later from their profile page

-- Remove NOT NULL constraint from identity_card_url
ALTER TABLE trainer_profiles 
ALTER COLUMN identity_card_url DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'trainer_profiles' 
  AND column_name IN ('identity_card_url', 'avatar_url', 'certificate_documents');

