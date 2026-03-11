-- Add payment link columns to clients table for PhonePe integration

ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_status TEXT DEFAULT 'pending';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phonepe_order_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_phonepe_transaction_id ON clients(phonepe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_clients_phonepe_order_id ON clients(phonepe_order_id);
CREATE INDEX IF NOT EXISTS idx_clients_payment_link_status ON clients(payment_link_status);

-- Add comment
COMMENT ON COLUMN clients.payment_link_id IS 'Unique payment link identifier';
COMMENT ON COLUMN clients.payment_link_url IS 'PhonePe payment URL for client';
COMMENT ON COLUMN clients.payment_link_status IS 'Status: pending, completed, failed, expired';
COMMENT ON COLUMN clients.phonepe_transaction_id IS 'PhonePe merchant transaction ID (our generated ID)';
COMMENT ON COLUMN clients.phonepe_order_id IS 'PhonePe order ID (PhonePe generated ID)';
