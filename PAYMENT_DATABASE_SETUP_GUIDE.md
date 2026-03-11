# Payment System Database Setup Guide

## 🚀 Quick Start

### Option 1: Run Master Migration File (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `SETUP_PAYMENT_SYSTEM.sql`
3. Click **Run**
4. Verify success (no errors should appear)

### Option 2: Run Individual Migration Files

Run these files in order:

1. `create_trainer_payment_details.sql`
2. `add_payment_fields_to_clients.sql`
3. `create_payment_transactions.sql`
4. `create_payment_schedules.sql`

---

## ✅ Verification Steps

After running the migrations, verify the setup:

### 1. Check Tables Exist

```sql
-- Should return all 3 new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'trainer_payment_details', 
    'payment_transactions', 
    'payment_schedules'
  );
```

### 2. Check Columns Added to Clients

```sql
-- Should show new payment columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN (
    'fee_amount', 
    'fee_currency', 
    'fee_frequency', 
    'payment_status', 
    'total_paid', 
    'last_payment_date'
  );
```

### 3. Check RLS Policies

```sql
-- Should return policies for all payment tables
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'trainer_payment_details', 
  'payment_transactions', 
  'payment_schedules'
);
```

### 4. Check Triggers

```sql
-- Should show triggers for automatic updates
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN (
  'trainer_payment_details', 
  'payment_transactions', 
  'payment_schedules',
  'clients'
) 
AND trigger_name LIKE '%payment%';
```

---

## 🧪 Test the System

### Test 1: Create Trainer Payment Details

```sql
-- Insert test payment details (replace with real trainer_id)
INSERT INTO trainer_payment_details (
  trainer_id,
  bank_account_number,
  bank_ifsc_code,
  bank_name,
  account_holder_name,
  upi_id,
  preferred_payment_method,
  is_verified
) VALUES (
  'YOUR_TRAINER_ID_HERE',
  '1234567890',
  'SBIN0001234',
  'State Bank of India',
  'John Doe',
  'john@upi',
  'bank',
  false
);

-- Verify insertion
SELECT * FROM trainer_payment_details;
```

### Test 2: Assign Permanent Client with Fee

```sql
-- Update existing client to permanent with fee (replace client_id)
UPDATE clients 
SET 
  class_type = 'permanent',
  fee_amount = 5000.00,
  fee_frequency = 'monthly'
WHERE id = 'YOUR_CLIENT_ID_HERE';

-- Check payment_status was automatically set
SELECT 
  id, 
  first_name, 
  last_name, 
  class_type, 
  fee_amount, 
  payment_status 
FROM clients 
WHERE id = 'YOUR_CLIENT_ID_HERE';
```

### Test 3: Record a Payment Transaction

```sql
-- Record a test payment (replace IDs with real ones)
INSERT INTO payment_transactions (
  client_id,
  trainer_id,
  amount,
  payment_method,
  transaction_reference,
  payment_date,
  status,
  recorded_by
) VALUES (
  'YOUR_CLIENT_ID_HERE',
  'YOUR_TRAINER_ID_HERE',
  5000.00,
  'bank_transfer',
  'UTR123456789',
  NOW(),
  'completed',
  auth.uid() -- Current admin user
);

-- Verify client payment status updated automatically
SELECT 
  id,
  fee_amount,
  total_paid,
  payment_status,
  last_payment_date
FROM clients 
WHERE id = 'YOUR_CLIENT_ID_HERE';
```

### Test 4: Create Payment Schedule

```sql
-- Create a monthly payment schedule
INSERT INTO payment_schedules (
  client_id,
  trainer_id,
  amount,
  frequency,
  start_date,
  next_payment_date,
  created_by
) VALUES (
  'YOUR_CLIENT_ID_HERE',
  'YOUR_TRAINER_ID_HERE',
  5000.00,
  'monthly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  auth.uid()
);

-- Verify schedule created
SELECT * FROM payment_schedules;
```

---

## 🔐 Security Verification

### Test RLS Policies

You should test that:

1. **Trainers can only see their own payment details**
2. **Trainers can only see their own transactions**
3. **Admins can see all data**
4. **Only admins can record payments**

To test, you'll need to:
- Log in as a trainer
- Log in as an admin
- Try to access/modify data

---

## 📊 Useful Queries

### Get All Trainers with Payment Details Status

```sql
SELECT 
  tp.id as trainer_id,
  u.email,
  u.raw_user_meta_data->>'firstName' as first_name,
  u.raw_user_meta_data->>'lastName' as last_name,
  tpd.is_verified as payment_details_verified,
  tpd.preferred_payment_method,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT CASE WHEN c.class_type = 'permanent' THEN c.id END) as permanent_clients,
  COALESCE(SUM(c.total_paid), 0) as total_paid_to_trainer
FROM trainer_profiles tp
JOIN auth.users u ON tp.user_id = u.id
LEFT JOIN trainer_payment_details tpd ON tp.id = tpd.trainer_id
LEFT JOIN clients c ON tp.id = c.trainer_id
GROUP BY tp.id, u.email, u.raw_user_meta_data, tpd.is_verified, tpd.preferred_payment_method;
```

### Get Payment Summary by Trainer

```sql
SELECT 
  t.trainer_id,
  t.trainer_name,
  COUNT(pt.id) as total_transactions,
  SUM(pt.amount) as total_amount,
  MAX(pt.payment_date) as last_payment_date
FROM (
  SELECT 
    tp.id as trainer_id,
    u.raw_user_meta_data->>'firstName' || ' ' || u.raw_user_meta_data->>'lastName' as trainer_name
  FROM trainer_profiles tp
  JOIN auth.users u ON tp.user_id = u.id
) t
LEFT JOIN payment_transactions pt ON t.trainer_id = pt.trainer_id
GROUP BY t.trainer_id, t.trainer_name
ORDER BY total_amount DESC NULLS LAST;
```

### Get Outstanding Payments

```sql
SELECT 
  c.id,
  c.first_name || ' ' || c.last_name as client_name,
  u.raw_user_meta_data->>'firstName' || ' ' || u.raw_user_meta_data->>'lastName' as trainer_name,
  c.fee_amount,
  c.total_paid,
  (c.fee_amount - COALESCE(c.total_paid, 0)) as outstanding,
  c.payment_status,
  c.last_payment_date,
  CASE 
    WHEN c.last_payment_date IS NULL THEN 
      EXTRACT(DAY FROM NOW() - c.created_at)
    ELSE 
      EXTRACT(DAY FROM NOW() - c.last_payment_date)
  END as days_since_last_payment
FROM clients c
JOIN trainer_profiles tp ON c.trainer_id = tp.id
JOIN auth.users u ON tp.user_id = u.id
WHERE c.class_type = 'permanent' 
  AND c.payment_status IN ('pending', 'partially_paid', 'overdue')
  AND c.fee_amount IS NOT NULL
ORDER BY days_since_last_payment DESC;
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

This means tables already exist. To recreate:

```sql
-- WARNING: This will delete all payment data!
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS trainer_payment_details CASCADE;

-- Then re-run the migration
```

### Error: "column already exists"

The clients table already has payment columns. Skip that migration file.

### Error: "function does not exist"

Make sure `update_updated_at_column()` function exists from your original schema:

```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';
```

If not found, create it:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### RLS Policies Not Working

Make sure you have the `profiles` table with role column:

```sql
SELECT * FROM profiles WHERE role = 'admin';
```

---

## 📝 Next Steps

After successful database setup:

1. ✅ Verify all tables exist
2. ✅ Test RLS policies
3. ✅ Create test data
4. ⏭️ Proceed to Phase 2: Build UI components
5. ⏭️ Implement payment settings for trainers
6. ⏭️ Implement payment management for admins

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs for detailed error messages
2. Verify your database version supports all features
3. Ensure you're running queries as an admin user
4. Check that all prerequisite tables exist (`trainer_profiles`, `clients`, `profiles`)

---

## 🎉 Success!

If all verification queries return expected results, your payment system database is ready!

Next: Start building the UI components for trainer payment setup.
