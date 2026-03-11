-- =====================================================
-- Update Payment Transactions Table Schema
-- =====================================================
-- Add columns to store complete fee breakdown
-- =====================================================

-- Add new columns to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS total_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS trainer_amount DECIMAL(10, 2);

-- Update existing records to populate new columns based on client data
UPDATE payment_transactions pt
SET 
  platform_fee_percentage = c.platform_fee_percentage,
  trainer_amount = pt.amount,
  total_fee = CASE 
    WHEN c.platform_fee_percentage > 0 AND c.platform_fee_percentage < 100 
    THEN pt.amount / ((100 - c.platform_fee_percentage) / 100)
    ELSE pt.amount
  END,
  platform_fee = CASE 
    WHEN c.platform_fee_percentage > 0 AND c.platform_fee_percentage < 100 
    THEN (pt.amount / ((100 - c.platform_fee_percentage) / 100)) - pt.amount
    ELSE 0
  END
FROM clients c
WHERE pt.client_id = c.id
  AND pt.total_fee IS NULL;

-- Add check constraints
ALTER TABLE payment_transactions
ADD CONSTRAINT check_total_fee_positive 
  CHECK (total_fee IS NULL OR total_fee > 0);

ALTER TABLE payment_transactions
ADD CONSTRAINT check_platform_fee_percentage_range 
  CHECK (platform_fee_percentage IS NULL OR (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100));

ALTER TABLE payment_transactions
ADD CONSTRAINT check_trainer_amount_positive 
  CHECK (trainer_amount IS NULL OR trainer_amount > 0);

-- Add comment for documentation
COMMENT ON COLUMN payment_transactions.total_fee IS 'Total fee charged to client (before platform fee deduction)';
COMMENT ON COLUMN payment_transactions.platform_fee_percentage IS 'Platform fee percentage at the time of transaction';
COMMENT ON COLUMN payment_transactions.platform_fee IS 'Platform fee amount (total_fee * platform_fee_percentage / 100)';
COMMENT ON COLUMN payment_transactions.trainer_amount IS 'Amount paid to trainer (total_fee - platform_fee)';

-- Update the old 'amount' column comment
COMMENT ON COLUMN payment_transactions.amount IS 'DEPRECATED: Use trainer_amount instead. This column kept for backward compatibility.';

-- Create or replace a function to auto-calculate fee breakdown
CREATE OR REPLACE FUNCTION calculate_payment_fee_breakdown()
RETURNS TRIGGER AS $$
BEGIN
  -- If total_fee is provided, calculate other values
  IF NEW.total_fee IS NOT NULL AND NEW.platform_fee_percentage IS NOT NULL THEN
    NEW.platform_fee := NEW.total_fee * NEW.platform_fee_percentage / 100;
    NEW.trainer_amount := NEW.total_fee - NEW.platform_fee;
    NEW.amount := NEW.trainer_amount; -- Keep amount in sync for backward compatibility
  
  -- If trainer_amount is provided with percentage, calculate total_fee
  ELSIF NEW.trainer_amount IS NOT NULL AND NEW.platform_fee_percentage IS NOT NULL THEN
    IF NEW.platform_fee_percentage > 0 AND NEW.platform_fee_percentage < 100 THEN
      NEW.total_fee := NEW.trainer_amount / ((100 - NEW.platform_fee_percentage) / 100);
      NEW.platform_fee := NEW.total_fee - NEW.trainer_amount;
    ELSE
      NEW.total_fee := NEW.trainer_amount;
      NEW.platform_fee := 0;
    END IF;
    NEW.amount := NEW.trainer_amount; -- Keep amount in sync
  
  -- Fallback: if only amount is provided (old behavior)
  ELSIF NEW.amount IS NOT NULL AND NEW.total_fee IS NULL THEN
    NEW.trainer_amount := NEW.amount;
    -- Try to get platform_fee_percentage from client
    IF NEW.platform_fee_percentage IS NULL THEN
      SELECT platform_fee_percentage INTO NEW.platform_fee_percentage
      FROM clients
      WHERE id = NEW.client_id;
    END IF;
    
    IF NEW.platform_fee_percentage IS NOT NULL AND NEW.platform_fee_percentage > 0 AND NEW.platform_fee_percentage < 100 THEN
      NEW.total_fee := NEW.amount / ((100 - NEW.platform_fee_percentage) / 100);
      NEW.platform_fee := NEW.total_fee - NEW.amount;
    ELSE
      NEW.total_fee := NEW.amount;
      NEW.platform_fee := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate fee breakdown
DROP TRIGGER IF EXISTS trigger_calculate_payment_fee_breakdown ON payment_transactions;
CREATE TRIGGER trigger_calculate_payment_fee_breakdown
  BEFORE INSERT OR UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_fee_breakdown();

-- Verification query (run this to check the updates)
-- SELECT 
--   id,
--   client_id,
--   amount as old_amount,
--   total_fee,
--   platform_fee_percentage,
--   platform_fee,
--   trainer_amount,
--   payment_date
-- FROM payment_transactions
-- ORDER BY payment_date DESC
-- LIMIT 10;
