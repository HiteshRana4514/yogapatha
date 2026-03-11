-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  client_designation VARCHAR(255),
  client_image_url TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public read access to active testimonials
CREATE POLICY "Public can view active testimonials"
  ON testimonials
  FOR SELECT
  USING (status = 'active');

-- Allow authenticated users (admins) to do everything
CREATE POLICY "Authenticated users can manage testimonials"
  ON testimonials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- Insert sample testimonials
INSERT INTO testimonials (client_name, client_designation, testimonial_text, rating, is_featured, display_order, status) VALUES
('Priya Sharma', 'Software Engineer', 'YogaPatha transformed my life! The personalized training sessions helped me achieve my fitness goals while maintaining work-life balance.', 5, true, 1, 'active'),
('Rahul Verma', 'Business Owner', 'Excellent platform with professional trainers. The flexibility to schedule sessions according to my busy routine is amazing.', 5, true, 2, 'active'),
('Anjali Patel', 'Teacher', 'I have been practicing yoga with YogaPatha for 6 months now. The trainers are knowledgeable and the sessions are very effective.', 4, false, 3, 'active');
