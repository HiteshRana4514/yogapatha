-- Support Tickets Table
-- Stores help and support tickets from trainers and clients
-- Admins can view, respond to, and manage all tickets

-- Drop existing table if recreating (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS support_tickets CASCADE;

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ticket Information
  ticket_number TEXT UNIQUE NOT NULL, -- Auto-generated: TKT-YYYYMMDD-XXXX
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'technical_issue',
    'billing',
    'account',
    'client_management',
    'feature_request',
    'general_inquiry',
    'other'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  
  -- User Information
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('trainer', 'client', 'admin')),
  created_by_name TEXT NOT NULL, -- Store name for easy display
  created_by_email TEXT NOT NULL, -- Store email for easy display
  
  -- Admin Response
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin assigned to ticket
  admin_response TEXT, -- Admin's response/notes
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Attachments (optional - URLs to uploaded files)
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {url, filename, uploaded_at}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own tickets
CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Users can create tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own open tickets
CREATE POLICY "Users can update own open tickets"
  ON support_tickets FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND status IN ('open', 'waiting_response')
  );

-- Policy: Admins can read all tickets
CREATE POLICY "Admins can read all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete tickets
CREATE POLICY "Admins can delete tickets"
  ON support_tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on support_tickets
DROP TRIGGER IF EXISTS update_support_tickets_updated_at_trigger ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at_trigger
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_part TEXT;
  ticket_count INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Count tickets created today
  SELECT COUNT(*) INTO ticket_count
  FROM support_tickets
  WHERE ticket_number LIKE 'TKT-' || date_part || '-%';
  
  -- Generate sequence number (padded to 4 digits)
  sequence_part := LPAD((ticket_count + 1)::TEXT, 4, '0');
  
  -- Return formatted ticket number
  RETURN 'TKT-' || date_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional - remove in production)
-- INSERT INTO support_tickets (
--   ticket_number,
--   subject,
--   description,
--   category,
--   priority,
--   status,
--   created_by,
--   created_by_role,
--   created_by_name,
--   created_by_email
-- ) VALUES (
--   generate_ticket_number(),
--   'Unable to access client details',
--   'I am unable to view the details of my assigned clients. When I click on a client, the page shows a loading spinner but never loads.',
--   'technical_issue',
--   'high',
--   'open',
--   'user-id-here',
--   'trainer',
--   'John Doe',
--   'john@example.com'
-- );

-- Query examples:

-- Get all open tickets
-- SELECT * FROM support_tickets WHERE status = 'open' ORDER BY created_at DESC;

-- Get tickets by user
-- SELECT * FROM support_tickets WHERE created_by = 'user-id' ORDER BY created_at DESC;

-- Get tickets by category
-- SELECT * FROM support_tickets WHERE category = 'technical_issue' ORDER BY priority DESC, created_at DESC;

-- Get ticket statistics
-- SELECT 
--   status,
--   COUNT(*) as count,
--   COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
--   COUNT(*) FILTER (WHERE priority = 'high') as high_count
-- FROM support_tickets
-- GROUP BY status;

-- Update ticket status
-- UPDATE support_tickets 
-- SET 
--   status = 'resolved',
--   resolved_at = NOW(),
--   resolved_by = 'admin-user-id',
--   resolution_notes = 'Issue has been fixed'
-- WHERE id = 'ticket-id';

-- Add admin response
-- UPDATE support_tickets 
-- SET 
--   admin_response = 'We are looking into this issue. Will update you soon.',
--   responded_at = NOW(),
--   responded_by = 'admin-user-id',
--   status = 'in_progress'
-- WHERE id = 'ticket-id';

COMMENT ON TABLE support_tickets IS 'Stores help and support tickets from users';
COMMENT ON COLUMN support_tickets.ticket_number IS 'Auto-generated unique ticket number in format TKT-YYYYMMDD-XXXX';
COMMENT ON COLUMN support_tickets.category IS 'Type of support request';
COMMENT ON COLUMN support_tickets.priority IS 'Urgency level of the ticket';
COMMENT ON COLUMN support_tickets.status IS 'Current status of the ticket';
COMMENT ON COLUMN support_tickets.created_by_role IS 'Role of the user who created the ticket';
COMMENT ON COLUMN support_tickets.attachments IS 'JSON array of attachment URLs and metadata';

