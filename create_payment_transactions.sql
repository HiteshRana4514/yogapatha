-- =====================================================
-- Payment Transactions Table
-- =====================================================
-- Records all payment transactions from admin to trainers
-- Supports multiple payment methods and tracks payment proof
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque', 'online', 'other')
  ),
  
  -- Transaction Information
  transaction_reference TEXT, -- UTR number, Transaction ID, Cheque number, etc.
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_proof_url TEXT, -- Cloudinary URL for receipt/screenshot
  
  -- Transaction Status
  status TEXT DEFAULT 'completed' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  
  -- Payment Period (for recurring payments)
  payment_period_start DATE,
  payment_period_end DATE,
  
  -- Notes
  admin_notes TEXT,
  trainer_notes TEXT, -- Trainers can add notes (read-only for viewing)
  
  -- Audit Trail
  recorded_by UUID NOT NULL REFERENCES auth.users(id), -- Admin who recorded the payment
  updated_by UUID REFERENCES auth.users(id), -- Last person to update
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_payment_period CHECK (
    payment_period_start IS NULL OR 
    payment_period_end IS NULL OR 
    payment_period_end >= payment_period_start
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id 
  ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_trainer_id 
  ON payment_transactions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_date 
  ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
  ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method 
  ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at 
  ON payment_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers view own payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins manage all payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins insert payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins update payments" ON payment_transactions;

-- Policy: Trainers can view their own payment transactions
CREATE POLICY "Trainers view own payments"
  ON payment_transactions FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM trainer_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all payment transactions
CREATE POLICY "Admins view all payments"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert payment transactions
CREATE POLICY "Admins insert payments"
  ON payment_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update payment transactions
CREATE POLICY "Admins update payments"
  ON payment_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update client payment status after transaction
CREATE OR REPLACE FUNCTION update_client_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client's total_paid and last_payment_date
  UPDATE clients
  SET 
    total_paid = COALESCE(total_paid, 0) + NEW.amount,
    last_payment_date = NEW.payment_date,
    updated_at = NOW()
  WHERE id = NEW.client_id;
  
  -- Update payment_status based on total_paid vs fee_amount
  UPDATE clients
  SET payment_status = CASE
    WHEN total_paid >= fee_amount THEN 'paid'
    WHEN total_paid > 0 AND total_paid < fee_amount THEN 'partially_paid'
    ELSE payment_status
  END
  WHERE id = NEW.client_id AND fee_amount IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update client payment status when payment is recorded
DROP TRIGGER IF EXISTS trigger_update_client_payment_status ON payment_transactions;
CREATE TRIGGER trigger_update_client_payment_status
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_client_payment_status();

-- Comments for documentation
COMMENT ON TABLE payment_transactions IS 'Records all payment transactions from admin to trainers for client services';
COMMENT ON COLUMN payment_transactions.transaction_reference IS 'UTR number, transaction ID, cheque number, or other reference';
COMMENT ON COLUMN payment_transactions.payment_proof_url IS 'Cloudinary URL for uploaded payment receipt or screenshot';
COMMENT ON COLUMN payment_transactions.recorded_by IS 'Admin user who recorded this payment transaction';

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON payment_transactions TO authenticated;
