-- Database function to get all trainers with their metadata
-- This function joins trainer_profiles with auth.users to get user metadata
-- Run this in your Supabase SQL Editor

-- Drop existing function and view to avoid type conflicts
DROP FUNCTION IF EXISTS get_trainers_with_metadata();
DROP VIEW IF EXISTS trainers_with_metadata;

-- Create the function
CREATE FUNCTION get_trainers_with_metadata()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  pincode TEXT,
  bio TEXT,
  experience TEXT,
  specializations JSONB,
  certifications TEXT,
  kyc_status TEXT,
  partnership_status TEXT,
  wants_partnership BOOLEAN,
  avatar_url TEXT,
  identity_card_url TEXT,
  certificate_documents JSONB,
  academy_name TEXT,
  academy_address TEXT,
  academy_logo_url TEXT,
  verified_at TIMESTAMPTZ,
  client_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to access auth.users
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.id,
    tp.user_id,
    COALESCE(u.raw_user_meta_data->>'firstName', u.raw_user_meta_data->>'first_name', 'N/A')::TEXT as first_name,
    COALESCE(u.raw_user_meta_data->>'lastName', u.raw_user_meta_data->>'last_name', 'N/A')::TEXT as last_name,
    COALESCE(u.email::TEXT, 'N/A') as email,
    COALESCE(u.raw_user_meta_data->>'phone', 'N/A')::TEXT as phone,
    COALESCE(u.raw_user_meta_data->>'city', 'N/A')::TEXT as city,
    COALESCE(u.raw_user_meta_data->>'state', 'N/A')::TEXT as state,
    COALESCE(u.raw_user_meta_data->>'address', 'N/A')::TEXT as address,
    COALESCE(u.raw_user_meta_data->>'pincode', 'N/A')::TEXT as pincode,
    COALESCE(u.raw_user_meta_data->>'bio', '')::TEXT as bio,
    COALESCE(u.raw_user_meta_data->>'experience', 'N/A')::TEXT as experience,
    COALESCE(u.raw_user_meta_data->'specializations', '[]'::jsonb) as specializations,
    COALESCE(u.raw_user_meta_data->>'certifications', '')::TEXT as certifications,
    COALESCE(tp.kyc_status, 'pending')::TEXT as kyc_status,
    tp.partnership_status,
    COALESCE(tp.wants_partnership, false) as wants_partnership,
    tp.avatar_url,
    tp.identity_card_url,
    COALESCE(tp.certificate_documents, '[]'::jsonb) as certificate_documents,
    tp.academy_name,
    tp.academy_address,
    tp.academy_logo_url,
    tp.verified_at,
    (SELECT COUNT(*)::BIGINT FROM clients WHERE clients.trainer_id = tp.id) as client_count,
    tp.created_at,
    tp.updated_at
  FROM trainer_profiles tp
  JOIN auth.users u ON tp.user_id = u.id
  ORDER BY tp.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trainers_with_metadata() TO authenticated;

-- Optional: Create a view for easier querying (alternative approach)
-- Drop the view first to avoid type mismatch errors
DROP VIEW IF EXISTS trainers_with_metadata;

CREATE VIEW trainers_with_metadata AS
SELECT
  tp.id,
  tp.user_id,
  COALESCE(u.raw_user_meta_data->>'firstName', u.raw_user_meta_data->>'first_name', 'N/A')::TEXT as first_name,
  COALESCE(u.raw_user_meta_data->>'lastName', u.raw_user_meta_data->>'last_name', 'N/A')::TEXT as last_name,
  COALESCE(u.email::TEXT, 'N/A') as email,
  COALESCE(u.raw_user_meta_data->>'phone', 'N/A')::TEXT as phone,
  COALESCE(u.raw_user_meta_data->>'city', 'N/A')::TEXT as city,
  COALESCE(u.raw_user_meta_data->>'state', 'N/A')::TEXT as state,
  COALESCE(u.raw_user_meta_data->>'address', 'N/A')::TEXT as address,
  COALESCE(u.raw_user_meta_data->>'pincode', 'N/A')::TEXT as pincode,
  COALESCE(u.raw_user_meta_data->>'bio', '')::TEXT as bio,
  COALESCE(u.raw_user_meta_data->>'experience', 'N/A')::TEXT as experience,
  COALESCE(u.raw_user_meta_data->'specializations', '[]'::jsonb) as specializations,
  COALESCE(u.raw_user_meta_data->>'certifications', '')::TEXT as certifications,
  COALESCE(tp.kyc_status, 'pending')::TEXT as kyc_status,
  tp.partnership_status,
  COALESCE(tp.wants_partnership, false) as wants_partnership,
  tp.avatar_url,
  tp.identity_card_url,
  COALESCE(tp.certificate_documents, '[]'::jsonb) as certificate_documents,
  tp.academy_name,
  tp.academy_address,
  tp.academy_logo_url,
  tp.verified_at,
  tp.created_at,
  tp.updated_at
FROM trainer_profiles tp
JOIN auth.users u ON tp.user_id = u.id;

-- Grant select permission on the view
GRANT SELECT ON trainers_with_metadata TO authenticated;

