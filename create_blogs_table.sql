-- Blogs Table
-- Stores blog posts with rich content, images, and multilingual support

CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly version of title
  description TEXT, -- Short excerpt/summary
  content TEXT NOT NULL, -- Rich HTML content from editor
  image_url TEXT, -- Featured image (Cloudinary URL)
  cloudinary_public_id TEXT, -- For deletion from Cloudinary
  language TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english', 'hindi')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT, -- Store author name for display
  is_featured BOOLEAN DEFAULT FALSE, -- Show on landing page
  tags TEXT[], -- Array of tags
  views_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE, -- Draft or published
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_blogs_language ON blogs(language);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published blogs
CREATE POLICY "Anyone can read published blogs"
  ON blogs FOR SELECT
  USING (published = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all blogs"
  ON blogs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS blogs_updated_at_trigger ON blogs;
CREATE TRIGGER blogs_updated_at_trigger
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blogs_updated_at();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;
