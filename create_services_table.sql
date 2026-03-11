-- Create services table for managing services displayed on the website
-- Admin can create, update, delete, and toggle active/inactive status

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  
  -- Service Details
  popular_tag BOOLEAN DEFAULT FALSE, -- Shows "Popular" badge
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings (pointers)
  
  -- Additional Info (optional)
  price TEXT, -- e.g., "$80/session"
  duration TEXT, -- e.g., "60 mins"
  rating DECIMAL(2,1) DEFAULT 0.0, -- e.g., 4.9
  category TEXT, -- e.g., "Personal", "Group", "Cardio"
  
  -- Status and Ordering
  is_active BOOLEAN DEFAULT TRUE, -- Show/hide service on website
  display_order INTEGER DEFAULT 0, -- Order in which services appear
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Admin who created
  updated_by UUID REFERENCES auth.users(id) -- Admin who last updated
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_popular_tag ON services(popular_tag);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active services (for public website)
CREATE POLICY "Anyone can read active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Policy: Admins can read all services (including inactive)
CREATE POLICY "Admins can read all services"
  ON services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert services
CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update services
CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
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

-- Policy: Admins can delete services
CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on services
CREATE TRIGGER update_services_updated_at_trigger
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

-- Insert sample services (optional - for testing)
INSERT INTO services (title, description, image_url, popular_tag, features, price, duration, rating, category, display_order) VALUES
(
  'One-on-One Personal Training',
  'Get personalized attention from certified trainers with customized workout plans tailored specifically to your fitness goals and current level.',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  true,
  '["Custom workout plans", "Progress tracking", "Nutrition guidance", "Flexible scheduling"]'::jsonb,
  '$80/session',
  '60 mins',
  4.9,
  'Personal',
  1
),
(
  'Small Group Training',
  'Train with 3-6 people in a motivating group environment while still receiving personalized attention from expert trainers.',
  'https://images.unsplash.com/photo-1549476464-37392f717541?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  false,
  '["Group motivation", "Cost-effective", "Social interaction", "Varied workouts"]'::jsonb,
  '$35/session',
  '45 mins',
  4.7,
  'Group',
  2
),
(
  'HIIT Cardio Classes',
  'High-intensity interval training sessions designed to maximize calorie burn and improve cardiovascular endurance in minimal time.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  true,
  '["Fat burning", "Time efficient", "Cardiovascular health", "Energy boost"]'::jsonb,
  '$25/class',
  '30 mins',
  4.8,
  'Cardio',
  3
);

-- Verify the table was created
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

