-- Create separate table for client PhonePe payments
-- This is different from payment_transactions which tracks payments TO trainers

CREATE TABLE IF NOT EXISTS client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  
  -- PhonePe specific fields
  phonepe_order_id TEXT,
  phonepe_transaction_id TEXT,
  payment_method TEXT DEFAULT 'phonepe',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Additional info
  notes TEXT,
  
  CONSTRAINT client_payments_status_check CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_payments_client_id ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_status ON client_payments(status);
CREATE INDEX IF NOT EXISTS idx_client_payments_phonepe_order_id ON client_payments(phonepe_order_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_created_at ON client_payments(created_at DESC);

-- Enable RLS
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to manage client payments (simplified for now)
CREATE POLICY "Authenticated users can manage client payments"
  ON client_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE client_payments IS 'Tracks payments FROM clients via PhonePe payment gateway';
COMMENT ON COLUMN client_payments.client_id IS 'Reference to the client making the payment';
COMMENT ON COLUMN client_payments.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN client_payments.status IS 'Payment status: pending, completed, or failed';
COMMENT ON COLUMN client_payments.phonepe_order_id IS 'PhonePe generated order ID';
COMMENT ON COLUMN client_payments.phonepe_transaction_id IS 'Merchant transaction ID';
