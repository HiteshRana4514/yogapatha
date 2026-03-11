-- Function to get public trainer profile data
-- This function safely exposes trainer data for public viewing
-- It combines data from trainer_profiles and auth.users metadata

CREATE OR REPLACE FUNCTION get_public_trainer_profile(trainer_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', tp.id,
    'user_id', tp.user_id,
    'avatar_url', tp.avatar_url,
    'certificate_documents', tp.certificate_documents,
    'kyc_status', tp.kyc_status,
    'is_active', tp.is_active,
    'wants_partnership', tp.wants_partnership,
    'academy_name', tp.academy_name,
    'academy_address', tp.academy_address,
    'academy_logo_url', tp.academy_logo_url,
    'partnership_status', tp.partnership_status,
    'first_name', COALESCE((au.raw_user_meta_data->>'firstName')::text, 'Trainer'),
    'last_name', COALESCE((au.raw_user_meta_data->>'lastName')::text, ''),
    'phone', COALESCE((au.raw_user_meta_data->>'phone')::text, ''),
    'bio', COALESCE((au.raw_user_meta_data->>'bio')::text, ''),
    'specializations', COALESCE((au.raw_user_meta_data->'specializations')::jsonb, '[]'::jsonb),
    'experience', COALESCE((au.raw_user_meta_data->>'experience')::text, ''),
    'location', COALESCE((au.raw_user_meta_data->>'location')::text, ''),
    'email', p.email
  ) INTO result
  FROM trainer_profiles tp
  INNER JOIN auth.users au ON tp.user_id = au.id
  LEFT JOIN profiles p ON tp.user_id = p.id
  WHERE tp.id = trainer_profile_id
    AND tp.is_active = true;

  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users (for public access)
GRANT EXECUTE ON FUNCTION get_public_trainer_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_trainer_profile(UUID) TO authenticated;

-- Test the function (replace with actual trainer_profile_id)
-- SELECT get_public_trainer_profile('your-trainer-profile-id-here');
