-- Clients Table
-- Stores client information for the platform
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Address
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Fitness Details
  fitness_goals TEXT[], -- Array of goals: 'weight_loss', 'muscle_gain', 'flexibility', etc.
  health_conditions TEXT, -- Any health conditions or injuries
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer-Client Assignments Table
-- Manages the relationship between trainers and clients with demo/permanent status
CREATE TABLE IF NOT EXISTS trainer_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainer_profiles(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Assignment Type
  assignment_type TEXT NOT NULL DEFAULT 'demo' CHECK (assignment_type IN ('demo', 'permanent')),
  
  -- Demo Class Details (only for demo assignments)
  demo_class_date TIMESTAMP WITH TIME ZONE,
  demo_class_status TEXT CHECK (demo_class_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  demo_feedback TEXT, -- Trainer's feedback after demo class
  
  -- Assignment Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Notes
  admin_notes TEXT, -- Admin notes about the assignment
  
  -- Conversion tracking (when demo becomes permanent)
  converted_to_permanent_at TIMESTAMP WITH TIME ZONE,
  converted_by UUID REFERENCES auth.users(id), -- Admin who converted
  
  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id), -- Admin who made the assignment
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_assignments_trainer ON trainer_client_assignments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_client ON trainer_client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON trainer_client_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON trainer_client_assignments(status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Clients can read own profile"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Trainers can read assigned clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trainer_client_assignments
      WHERE trainer_client_assignments.client_id = clients.id
      AND trainer_client_assignments.trainer_id = auth.uid()
      AND trainer_client_assignments.status = 'active'
    )
  );

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for trainer_client_assignments table
CREATE POLICY "Trainers can read own assignments"
  ON trainer_client_assignments FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Clients can read own assignments"
  ON trainer_client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = trainer_client_assignments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments"
  ON trainer_client_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON trainer_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO clients (first_name, last_name, email, phone, city, state, fitness_goals, fitness_level, status)
VALUES 
  ('Sarah', 'Johnson', 'sarah.j@email.com', '+1-555-1234', 'New York', 'NY', ARRAY['weight_loss', 'cardio'], 'beginner', 'active'),
  ('Mike', 'Rodriguez', 'mike.r@email.com', '+1-555-5678', 'Los Angeles', 'CA', ARRAY['muscle_gain', 'strength'], 'intermediate', 'active'),
  ('Emma', 'Chen', 'emma.c@email.com', '+1-555-9012', 'Chicago', 'IL', ARRAY['flexibility', 'yoga'], 'beginner', 'active'),
  ('David', 'Lee', 'david.l@email.com', '+1-555-3456', 'Houston', 'TX', ARRAY['weight_loss', 'strength'], 'beginner', 'active'),
  ('Lisa', 'Anderson', 'lisa.a@email.com', '+1-555-7890', 'Phoenix', 'AZ', ARRAY['athletic_performance'], 'advanced', 'active'),
  ('James', 'Wilson', 'james.w@email.com', '+1-555-2345', 'Miami', 'FL', ARRAY['weight_loss'], 'beginner', 'inactive')
ON CONFLICT (email) DO NOTHING;
