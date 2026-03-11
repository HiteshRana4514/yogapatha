-- =====================================================
-- Trainer Payment Details Table
-- =====================================================
-- This table stores payment information for trainers
-- Supports: Bank Transfer, UPI, QR Code payments
-- Admin verification required before payments can be made
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS trainer_payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  
  -- Bank Account Details
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  
  -- UPI Details
  upi_id TEXT,
  upi_qr_code_url TEXT, -- Cloudinary URL for QR code image
  
  -- Preferred Payment Method
  preferred_payment_method TEXT CHECK (
    preferred_payment_method IN ('bank', 'upi', 'qr_code')
  ),
  
  -- Verification Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT, -- Reason if rejected
  
  -- Additional Info
  notes TEXT, -- Admin notes about payment details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_trainer_payment_details UNIQUE(trainer_id),
  CONSTRAINT valid_ifsc_format CHECK (
    bank_ifsc_code IS NULL OR 
    bank_ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
  ),
  CONSTRAINT valid_upi_format CHECK (
    upi_id IS NULL OR 
    upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z]+$'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainer_payment_details_trainer_id 
  ON trainer_payment_details(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_payment_details_verified 
  ON trainer_payment_details(is_verified);
CREATE INDEX IF NOT EXISTS idx_trainer_payment_details_method 
  ON trainer_payment_details(preferred_payment_method);

-- Enable Row Level Security
ALTER TABLE trainer_payment_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers manage own payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins view all payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins verify payment details" ON trainer_payment_details;

-- Policy: Trainers can view and manage their own payment details
CREATE POLICY "Trainers manage own payment details"
  ON trainer_payment_details FOR ALL
  USING (
    trainer_id IN (
      SELECT id FROM trainer_profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainer_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all payment details
CREATE POLICY "Admins view all payment details"
  ON trainer_payment_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update payment details (for verification)
CREATE POLICY "Admins verify payment details"
  ON trainer_payment_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_trainer_payment_details_updated_at ON trainer_payment_details;
CREATE TRIGGER update_trainer_payment_details_updated_at
  BEFORE UPDATE ON trainer_payment_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE trainer_payment_details IS 'Stores payment information for trainers including bank, UPI, and QR code details';
COMMENT ON COLUMN trainer_payment_details.is_verified IS 'Admin verification status - must be true before trainer can receive payments';
COMMENT ON COLUMN trainer_payment_details.preferred_payment_method IS 'Trainer preferred payment method: bank, upi, or qr_code';
COMMENT ON COLUMN trainer_payment_details.upi_qr_code_url IS 'Cloudinary URL for uploaded UPI QR code image';

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON trainer_payment_details TO authenticated;
