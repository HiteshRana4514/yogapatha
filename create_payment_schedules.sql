-- =====================================================
-- Payment Schedules Table
-- =====================================================
-- Manages recurring payment schedules for permanent clients
-- Helps track upcoming payments and automate reminders
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  
  -- Schedule Configuration
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  frequency TEXT NOT NULL CHECK (
    frequency IN ('one-time', 'weekly', 'monthly', 'quarterly', 'yearly')
  ),
  
  -- Schedule Period
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means ongoing/indefinite
  
  -- Next Payment Tracking
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  auto_reminder BOOLEAN DEFAULT TRUE, -- Send automatic payment reminders
  
  -- Additional Info
  description TEXT,
  notes TEXT,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_schedule_period CHECK (
    end_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT unique_active_schedule_per_client UNIQUE (client_id, is_active)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_schedules_client_id 
  ON payment_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_trainer_id 
  ON payment_schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_next_payment 
  ON payment_schedules(next_payment_date) 
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_schedules_active 
  ON payment_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_frequency 
  ON payment_schedules(frequency);

-- Enable Row Level Security
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers view own schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Admins view all schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Admins manage schedules" ON payment_schedules;

-- Policy: Trainers can view their own payment schedules
CREATE POLICY "Trainers view own schedules"
  ON payment_schedules FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM trainer_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all payment schedules
CREATE POLICY "Admins view all schedules"
  ON payment_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can manage all payment schedules
CREATE POLICY "Admins manage schedules"
  ON payment_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next payment date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  current_date DATE,
  freq TEXT
)
RETURNS DATE AS $$
BEGIN
  RETURN CASE freq
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN current_date + INTERVAL '1 year'
    ELSE current_date
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update schedule after payment is recorded
CREATE OR REPLACE FUNCTION update_payment_schedule_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  schedule_rec RECORD;
BEGIN
  -- Find active schedule for this client
  SELECT * INTO schedule_rec
  FROM payment_schedules
  WHERE client_id = NEW.client_id 
    AND is_active = TRUE
  LIMIT 1;
  
  -- If schedule exists and payment is completed, update it
  IF FOUND AND NEW.status = 'completed' THEN
    UPDATE payment_schedules
    SET 
      last_payment_date = NEW.payment_date::DATE,
      next_payment_date = calculate_next_payment_date(
        NEW.payment_date::DATE, 
        schedule_rec.frequency
      ),
      updated_at = NOW()
    WHERE id = schedule_rec.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update schedule when payment is recorded
DROP TRIGGER IF EXISTS trigger_update_schedule_after_payment ON payment_transactions;
CREATE TRIGGER trigger_update_schedule_after_payment
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_schedule_after_payment();

-- Comments for documentation
COMMENT ON TABLE payment_schedules IS 'Manages recurring payment schedules for tracking and automating payment reminders';
COMMENT ON COLUMN payment_schedules.next_payment_date IS 'Automatically calculated next payment due date';
COMMENT ON COLUMN payment_schedules.auto_reminder IS 'Whether to send automatic payment reminder notifications';
COMMENT ON COLUMN payment_schedules.is_active IS 'Only one active schedule allowed per client';

-- Grant permissions (if needed)
-- GRANT SELECT ON payment_schedules TO authenticated;
-- GRANT INSERT, UPDATE ON payment_schedules TO authenticated;
