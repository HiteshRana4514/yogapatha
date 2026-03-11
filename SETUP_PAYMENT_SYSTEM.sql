-- =====================================================
-- PAYMENT SYSTEM - MASTER MIGRATION FILE
-- =====================================================
-- Run this file to set up the complete payment management system
-- Includes all tables, policies, triggers, and functions
-- Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Create trainer_payment_details table
-- =====================================================

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
  upi_qr_code_url TEXT,
  
  -- Preferred Payment Method
  preferred_payment_method TEXT CHECK (
    preferred_payment_method IN ('bank', 'upi', 'qr_code')
  ),
  
  -- Verification Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Additional Info
  admin_notes TEXT,
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

CREATE INDEX IF NOT EXISTS idx_trainer_payment_details_trainer_id ON trainer_payment_details(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_payment_details_verified ON trainer_payment_details(is_verified);

ALTER TABLE trainer_payment_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers manage own payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins view all payment details" ON trainer_payment_details;
DROP POLICY IF EXISTS "Admins verify payment details" ON trainer_payment_details;

CREATE POLICY "Trainers manage own payment details"
  ON trainer_payment_details FOR ALL
  USING (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all payment details"
  ON trainer_payment_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins verify payment details"
  ON trainer_payment_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP TRIGGER IF EXISTS update_trainer_payment_details_updated_at ON trainer_payment_details;
CREATE TRIGGER update_trainer_payment_details_updated_at
  BEFORE UPDATE ON trainer_payment_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 2: Add payment fields to clients table
-- =====================================================

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS fee_frequency TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_fee_frequency_check') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_fee_frequency_check 
    CHECK (fee_frequency IN ('one-time', 'monthly', 'quarterly', 'yearly') OR fee_frequency IS NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_payment_status_check') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_payment_status_check 
    CHECK (payment_status IN ('not_applicable', 'pending', 'paid', 'partially_paid', 'overdue'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_fee_amount_check') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_fee_amount_check 
    CHECK (fee_amount IS NULL OR fee_amount > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_total_paid_check') THEN
    ALTER TABLE clients ADD CONSTRAINT clients_total_paid_check CHECK (total_paid >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON clients(payment_status) WHERE payment_status != 'not_applicable';
CREATE INDEX IF NOT EXISTS idx_clients_fee_amount ON clients(fee_amount) WHERE fee_amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_last_payment_date ON clients(last_payment_date DESC) WHERE last_payment_date IS NOT NULL;

CREATE OR REPLACE FUNCTION set_initial_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_type = 'demo' THEN
    NEW.payment_status = 'not_applicable';
    NEW.fee_amount = NULL;
    NEW.fee_frequency = NULL;
  ELSIF NEW.class_type = 'permanent' AND NEW.fee_amount IS NOT NULL THEN
    NEW.payment_status = 'pending';
  ELSIF NEW.class_type = 'permanent' AND NEW.fee_amount IS NULL THEN
    NEW.payment_status = 'not_applicable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_initial_payment_status ON clients;
CREATE TRIGGER trigger_set_initial_payment_status
  BEFORE INSERT OR UPDATE OF class_type, fee_amount ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_payment_status();

-- =====================================================
-- STEP 3: Create payment_transactions table
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque', 'online', 'other')
  ),
  transaction_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'completed' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  payment_period_start DATE,
  payment_period_end DATE,
  admin_notes TEXT,
  trainer_notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_payment_period CHECK (
    payment_period_start IS NULL OR payment_period_end IS NULL OR payment_period_end >= payment_period_start
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_trainer_id ON payment_transactions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_date ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers view own payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins view all payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins insert payments" ON payment_transactions;
DROP POLICY IF EXISTS "Admins update payments" ON payment_transactions;

CREATE POLICY "Trainers view own payments"
  ON payment_transactions FOR SELECT
  USING (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all payments"
  ON payment_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins insert payments"
  ON payment_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins update payments"
  ON payment_transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_client_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients
  SET 
    total_paid = COALESCE(total_paid, 0) + NEW.amount,
    last_payment_date = NEW.payment_date,
    updated_at = NOW()
  WHERE id = NEW.client_id;
  
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

DROP TRIGGER IF EXISTS trigger_update_client_payment_status ON payment_transactions;
CREATE TRIGGER trigger_update_client_payment_status
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_client_payment_status();

-- =====================================================
-- STEP 4: Create payment_schedules table
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  frequency TEXT NOT NULL CHECK (
    frequency IN ('one-time', 'weekly', 'monthly', 'quarterly', 'yearly')
  ),
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  auto_reminder BOOLEAN DEFAULT TRUE,
  description TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_schedule_period CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT unique_active_schedule_per_client UNIQUE (client_id, is_active)
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_client_id ON payment_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_trainer_id ON payment_schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_next_payment ON payment_schedules(next_payment_date) WHERE is_active = TRUE;

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers view own schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Admins view all schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Admins manage schedules" ON payment_schedules;

CREATE POLICY "Trainers view own schedules"
  ON payment_schedules FOR SELECT
  USING (trainer_id IN (SELECT id FROM trainer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all schedules"
  ON payment_schedules FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage schedules"
  ON payment_schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: Helper Functions
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_next_payment_date(base_date DATE, freq TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN CASE freq
    WHEN 'weekly' THEN base_date + INTERVAL '1 week'
    WHEN 'monthly' THEN base_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN base_date + INTERVAL '3 months'
    WHEN 'yearly' THEN base_date + INTERVAL '1 year'
    ELSE base_date
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_payment_schedule_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  schedule_rec RECORD;
BEGIN
  SELECT * INTO schedule_rec
  FROM payment_schedules
  WHERE client_id = NEW.client_id AND is_active = TRUE
  LIMIT 1;
  
  IF FOUND AND NEW.status = 'completed' THEN
    UPDATE payment_schedules
    SET 
      last_payment_date = NEW.payment_date::DATE,
      next_payment_date = calculate_next_payment_date(NEW.payment_date::DATE, schedule_rec.frequency),
      updated_at = NOW()
    WHERE id = schedule_rec.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_after_payment ON payment_transactions;
CREATE TRIGGER trigger_update_schedule_after_payment
  AFTER INSERT ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_schedule_after_payment();

-- =====================================================
-- COMPLETE! Payment system database setup finished.
-- =====================================================

-- Quick verification queries:
-- SELECT * FROM trainer_payment_details;
-- SELECT * FROM payment_transactions;
-- SELECT * FROM payment_schedules;
-- SELECT fee_amount, payment_status FROM clients WHERE class_type = 'permanent';
