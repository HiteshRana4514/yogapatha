-- Simple alternative: Create a view instead of a function
-- This is easier and doesn't require RPC calls
-- Run this in your Supabase SQL Editor

-- Drop existing view if it exists
DROP VIEW IF EXISTS trainers_with_metadata CASCADE;

-- Create a simple view that joins trainer_profiles with auth.users
CREATE VIEW trainers_with_metadata AS
SELECT 
  tp.id,
  tp.user_id,
  tp.kyc_status,
  tp.partnership_status,
  tp.wants_partnership,
  tp.avatar_url,
  tp.identity_card_url,
  tp.certificate_documents,
  tp.academy_name,
  tp.academy_address,
  tp.academy_logo_url,
  tp.verified_at,
  tp.created_at,
  tp.updated_at,
  u.email,
  u.raw_user_meta_data
FROM trainer_profiles tp
JOIN auth.users u ON tp.user_id = u.id;

-- Grant select permission to authenticated users
GRANT SELECT ON trainers_with_metadata TO authenticated;

-- Grant usage on auth schema (if needed)
GRANT USAGE ON SCHEMA auth TO authenticated;

