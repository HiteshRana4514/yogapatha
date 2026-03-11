-- Locations Management Tables
-- This allows admin to manage states and cities dynamically

-- States Table
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY, -- e.g., 'maharashtra'
  name TEXT NOT NULL, -- e.g., 'Maharashtra'
  slug TEXT UNIQUE NOT NULL, -- URL-friendly slug
  image TEXT, -- State image URL (Cloudinary)
  display_order INTEGER DEFAULT 0, -- Order in which states appear
  is_active BOOLEAN DEFAULT TRUE, -- Show/hide state
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY, -- e.g., 'mumbai'
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Mumbai'
  slug TEXT NOT NULL, -- URL-friendly slug
  display_order INTEGER DEFAULT 0, -- Order within state
  is_active BOOLEAN DEFAULT TRUE, -- Show/hide city
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(state_id, slug) -- Unique slug per state
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);
CREATE INDEX IF NOT EXISTS idx_states_is_active ON states(is_active);
CREATE INDEX IF NOT EXISTS idx_states_display_order ON states(display_order);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_is_active ON cities(is_active);

-- Enable Row Level Security
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active states
CREATE POLICY "Anyone can read active states"
  ON states FOR SELECT
  USING (is_active = true);

-- Policy: Admins can read all states
CREATE POLICY "Admins can read all states"
  ON states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert states
CREATE POLICY "Admins can insert states"
  ON states FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update states
CREATE POLICY "Admins can update states"
  ON states FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete states
CREATE POLICY "Admins can delete states"
  ON states FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Anyone can read active cities (in active states)
CREATE POLICY "Anyone can read active cities"
  ON cities FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM states 
      WHERE states.id = cities.state_id 
      AND states.is_active = true
    )
  );

-- Policy: Admins can read all cities
CREATE POLICY "Admins can read all cities"
  ON cities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert cities
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update cities
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete cities
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for states
DROP TRIGGER IF EXISTS update_states_updated_at_trigger ON states;
CREATE TRIGGER update_states_updated_at_trigger
  BEFORE UPDATE ON states
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- Trigger for cities
DROP TRIGGER IF EXISTS update_cities_updated_at_trigger ON cities;
CREATE TRIGGER update_cities_updated_at_trigger
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- Insert sample data (optional - for testing)
INSERT INTO states (id, name, slug, image, display_order) VALUES
('maharashtra', 'Maharashtra', 'maharashtra', 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1),
('delhi', 'Delhi', 'delhi', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 2),
('karnataka', 'Karnataka', 'karnataka', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cities (id, state_id, name, slug, display_order) VALUES
('mumbai', 'maharashtra', 'Mumbai', 'mumbai', 1),
('pune', 'maharashtra', 'Pune', 'pune', 2),
('nagpur', 'maharashtra', 'Nagpur', 'nagpur', 3),
('nashik', 'maharashtra', 'Nashik', 'nashik', 4),
('aurangabad', 'maharashtra', 'Aurangabad', 'aurangabad', 5),
('new-delhi', 'delhi', 'New Delhi', 'new-delhi', 1),
('dwarka', 'delhi', 'Dwarka', 'dwarka', 2),
('rohini', 'delhi', 'Rohini', 'rohini', 3),
('saket', 'delhi', 'Saket', 'saket', 4),
('bangalore', 'karnataka', 'Bangalore', 'bangalore', 1),
('mysore', 'karnataka', 'Mysore', 'mysore', 2),
('mangalore', 'karnataka', 'Mangalore', 'mangalore', 3),
('hubli', 'karnataka', 'Hubli', 'hubli', 4)
ON CONFLICT (state_id, slug) DO NOTHING;

-- View to get states with city count
CREATE OR REPLACE VIEW states_with_city_count AS
SELECT 
  s.*,
  COUNT(c.id) as city_count
FROM states s
LEFT JOIN cities c ON c.state_id = s.id AND c.is_active = true
GROUP BY s.id, s.name, s.slug, s.image, s.display_order, s.is_active, s.created_at, s.updated_at, s.created_by, s.updated_by
ORDER BY s.display_order ASC, s.name ASC;
