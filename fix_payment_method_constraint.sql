-- Fix payment_method constraint to allow all common payment methods
-- Drop the old constraint
ALTER TABLE payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

-- Add new constraint with all payment methods
ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque', 'online', 'other'));
