-- Add fee management fields to clients table
-- This allows admins to set fees when assigning permanent clients to trainers

-- Add new columns for fee management
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS total_fee DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trainer_income DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS fee_frequency TEXT DEFAULT 'monthly' CHECK (fee_frequency IN ('monthly', 'quarterly', 'yearly', 'one_time'));

-- Add comments to document the fields
COMMENT ON COLUMN clients.total_fee IS 'Total fee charged to the client (in the specified currency)';
COMMENT ON COLUMN clients.platform_fee_percentage IS 'Platform fee percentage (e.g., 20 for 20%)';
COMMENT ON COLUMN clients.trainer_income IS 'Calculated trainer income after platform fee deduction';
COMMENT ON COLUMN clients.fee_currency IS 'Currency code for the fee (default: INR)';
COMMENT ON COLUMN clients.fee_frequency IS 'Frequency of fee payment (monthly, quarterly, yearly, one_time)';

-- Create a function to automatically calculate trainer income
CREATE OR REPLACE FUNCTION calculate_trainer_income()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both total_fee and platform_fee_percentage are set
  IF NEW.total_fee IS NOT NULL AND NEW.platform_fee_percentage IS NOT NULL THEN
    -- Calculate trainer income: total_fee - (total_fee * platform_fee_percentage / 100)
    NEW.trainer_income := NEW.total_fee - (NEW.total_fee * NEW.platform_fee_percentage / 100);
  ELSE
    NEW.trainer_income := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate trainer income on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_trainer_income ON clients;
CREATE TRIGGER trigger_calculate_trainer_income
  BEFORE INSERT OR UPDATE OF total_fee, platform_fee_percentage
  ON clients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trainer_income();

-- Add index for faster queries on fee-related fields
CREATE INDEX IF NOT EXISTS idx_clients_total_fee ON clients(total_fee);
CREATE INDEX IF NOT EXISTS idx_clients_trainer_income ON clients(trainer_income);

-- Sample update to demonstrate usage (optional - comment out if not needed)
-- UPDATE clients 
-- SET 
--   total_fee = 5000.00,
--   platform_fee_percentage = 20.00,
--   fee_frequency = 'monthly'
-- WHERE class_type = 'permanent' AND trainer_id IS NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND column_name IN ('total_fee', 'platform_fee_percentage', 'trainer_income', 'fee_currency', 'fee_frequency')
ORDER BY ordinal_position;

