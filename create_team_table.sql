-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  specialization TEXT,
  experience_years INTEGER,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_featured ON team_members(is_featured);
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON team_members(display_order);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public read access to active team members
CREATE POLICY "Public can view active team members"
  ON team_members
  FOR SELECT
  USING (status = 'active');

-- Allow authenticated users (admins) to do everything
CREATE POLICY "Authenticated users can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Insert sample team members
INSERT INTO team_members (name, designation, bio, specialization, experience_years, is_featured, display_order, status) VALUES
('Dr. Amit Kumar', 'Founder & Chief Yoga Instructor', 'With over 15 years of experience in yoga and wellness, Dr. Amit leads our team with passion and expertise. Certified in multiple yoga disciplines including Hatha, Vinyasa, and Ashtanga.', 'Hatha Yoga, Meditation', 15, true, 1, 'active'),
('Priya Sharma', 'Senior Yoga Instructor', 'Priya specializes in prenatal and postnatal yoga, helping mothers maintain their wellness journey. She has trained over 500 students and conducts workshops across India.', 'Prenatal Yoga, Therapeutic Yoga', 8, true, 2, 'active'),
('Rahul Verma', 'Fitness & Wellness Coach', 'Combining traditional yoga with modern fitness techniques, Rahul creates personalized wellness programs for clients. He holds certifications in nutrition and sports science.', 'Power Yoga, Fitness', 6, false, 3, 'active'),
('Anjali Patel', 'Meditation & Mindfulness Expert', 'Anjali brings ancient meditation practices to modern life. She specializes in stress management and corporate wellness programs.', 'Meditation, Mindfulness', 10, false, 4, 'active');
