-- =====================================================
-- Add Payment Fields to Clients Table
-- =====================================================
-- Extends the existing clients table to support payment tracking
-- for permanent clients with fee amounts and payment status
-- =====================================================

-- Add payment-related columns to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS fee_frequency TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Add constraints for new columns
DO $$ 
BEGIN
  -- Add check constraint for fee_frequency
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_fee_frequency_check'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_fee_frequency_check 
    CHECK (fee_frequency IN ('one-time', 'monthly', 'quarterly', 'yearly') OR fee_frequency IS NULL);
  END IF;

  -- Add check constraint for payment_status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_payment_status_check'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_payment_status_check 
    CHECK (payment_status IN ('not_applicable', 'pending', 'paid', 'partially_paid', 'overdue'));
  END IF;

  -- Add check constraint for fee_amount (must be positive if set)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_fee_amount_check'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_fee_amount_check 
    CHECK (fee_amount IS NULL OR fee_amount > 0);
  END IF;

  -- Add check constraint for total_paid (cannot be negative)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_total_paid_check'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_total_paid_check 
    CHECK (total_paid >= 0);
  END IF;
END $$;

-- Create indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_clients_payment_status 
  ON clients(payment_status) 
  WHERE payment_status != 'not_applicable';

CREATE INDEX IF NOT EXISTS idx_clients_fee_amount 
  ON clients(fee_amount) 
  WHERE fee_amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_last_payment_date 
  ON clients(last_payment_date DESC) 
  WHERE last_payment_date IS NOT NULL;

-- Function to automatically set payment_status based on class_type
CREATE OR REPLACE FUNCTION set_initial_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- For demo clients, payment is not applicable
  IF NEW.class_type = 'demo' THEN
    NEW.payment_status = 'not_applicable';
    NEW.fee_amount = NULL;
    NEW.fee_frequency = NULL;
  
  -- For permanent clients with fee, set status to pending
  ELSIF NEW.class_type = 'permanent' AND NEW.fee_amount IS NOT NULL THEN
    NEW.payment_status = 'pending';
  
  -- For permanent clients without fee, keep as not applicable
  ELSIF NEW.class_type = 'permanent' AND NEW.fee_amount IS NULL THEN
    NEW.payment_status = 'not_applicable';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set initial payment status when client is created/updated
DROP TRIGGER IF EXISTS trigger_set_initial_payment_status ON clients;
CREATE TRIGGER trigger_set_initial_payment_status
  BEFORE INSERT OR UPDATE OF class_type, fee_amount
  ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_payment_status();

-- Function to check for overdue payments (can be run periodically)
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark payments as overdue if:
  -- 1. Payment status is 'pending' or 'partially_paid'
  -- 2. Last payment was more than 45 days ago (or never paid and created 45+ days ago)
  -- 3. Fee frequency is monthly (adjust threshold based on frequency)
  
  UPDATE clients
  SET payment_status = 'overdue'
  WHERE payment_status IN ('pending', 'partially_paid')
    AND class_type = 'permanent'
    AND fee_amount IS NOT NULL
    AND (
      (last_payment_date IS NULL AND created_at < NOW() - INTERVAL '45 days')
      OR
      (last_payment_date IS NOT NULL AND last_payment_date < NOW() - INTERVAL '45 days')
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing clients to set appropriate payment status
-- Demo clients → not_applicable
-- Permanent clients without fee → not_applicable
-- Permanent clients with existing fee_amount → pending (if not already paid)
UPDATE clients 
SET payment_status = 'not_applicable' 
WHERE class_type = 'demo' 
  AND payment_status != 'not_applicable';

UPDATE clients 
SET payment_status = 'not_applicable' 
WHERE class_type = 'permanent' 
  AND fee_amount IS NULL 
  AND payment_status != 'not_applicable';

-- Comments for documentation
COMMENT ON COLUMN clients.fee_amount IS 'Monthly/periodic fee amount for permanent clients';
COMMENT ON COLUMN clients.fee_frequency IS 'Payment frequency: one-time, monthly, quarterly, yearly';
COMMENT ON COLUMN clients.payment_status IS 'Payment status: not_applicable (demo), pending, paid, partially_paid, overdue';
COMMENT ON COLUMN clients.total_paid IS 'Total amount paid to trainer for this client';
COMMENT ON COLUMN clients.last_payment_date IS 'Date of most recent payment transaction';

-- Example query to find overdue payments
-- SELECT * FROM clients WHERE payment_status = 'overdue';

-- Example to manually run overdue check
-- SELECT mark_overdue_payments();
