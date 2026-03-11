-- Add is_active field to trainer_profiles table
-- This allows admin to activate/deactivate trainer accounts

-- Add the is_active column (defaults to TRUE for existing trainers)
ALTER TABLE trainer_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_active ON trainer_profiles(is_active);

-- Update any existing trainers to be active by default
UPDATE trainer_profiles SET is_active = TRUE WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN trainer_profiles.is_active IS 'Trainer can login only if active. Managed by admin.';

