-- Media Gallery Table
-- Stores media items (images/videos) with Cloudinary URLs
-- Includes toggle for showing on landing page

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL, -- Cloudinary URL
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  cloudinary_public_id TEXT, -- For deletion from Cloudinary
  show_on_landing BOOLEAN DEFAULT FALSE, -- Toggle for landing page display
  display_order INTEGER DEFAULT 0, -- Order of display on landing page
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_media_show_on_landing ON media(show_on_landing);
CREATE INDEX IF NOT EXISTS idx_media_display_order ON media(display_order);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read media (public access)
CREATE POLICY "Anyone can read media"
  ON media FOR SELECT
  USING (true);

-- Policy: Admins can insert media
CREATE POLICY "Admins can insert media"
  ON media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update media
CREATE POLICY "Admins can update media"
  ON media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete media
CREATE POLICY "Admins can delete media"
  ON media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at on media
CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample query to get landing page media (max 8, ordered)
-- SELECT * FROM media 
-- WHERE show_on_landing = true 
-- ORDER BY display_order ASC, created_at DESC 
-- LIMIT 8;
