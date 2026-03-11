-- Fix column name mismatch in trainer_payment_details table
-- Run this in Supabase SQL Editor if you already created the table with 'notes'

-- Rename the column from 'notes' to 'admin_notes'
ALTER TABLE trainer_payment_details 
  RENAME COLUMN notes TO admin_notes;
