-- Add certifications column to trainer_profiles table
-- This column will store an array of certification objects with name and url

-- Add the certifications column (JSONB array)
ALTER TABLE trainer_profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN trainer_profiles.certifications IS 'Array of certification objects with structure: [{name: string, url: string}]';

-- Optional: Add a check constraint to ensure it's an array
ALTER TABLE trainer_profiles
ADD CONSTRAINT certifications_is_array
CHECK (jsonb_typeof(certifications) = 'array');

