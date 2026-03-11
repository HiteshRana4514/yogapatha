-- Update the status constraint on clients table
-- Change from: 'pending', 'active', 'inactive'
-- Change to: 'pending', 'accepted', 'rejected'

-- First, update any existing 'active' status to 'accepted'
UPDATE clients SET status = 'accepted' WHERE status = 'active';

-- Update any existing 'inactive' status to 'rejected'
UPDATE clients SET status = 'rejected' WHERE status = 'inactive';

-- Drop the old constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- Add the new constraint
ALTER TABLE clients ADD CONSTRAINT clients_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected'));

