-- =====================================================
-- Invoice Settings Table
-- =====================================================
-- Stores company/platform invoice configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Details
  company_name TEXT NOT NULL DEFAULT 'YogaPatha',
  company_tagline TEXT DEFAULT 'Professional Yoga Training Platform',
  company_logo_url TEXT, -- Cloudinary URL for logo
  
  -- Contact Information
  email TEXT NOT NULL DEFAULT 'support@yogapatha.com',
  phone TEXT NOT NULL DEFAULT '+91 XXX XXX XXXX',
  address TEXT NOT NULL DEFAULT 'Your Company Address Here',
  website TEXT DEFAULT 'www.yogapatha.com',
  
  -- Invoice Customization
  invoice_prefix TEXT DEFAULT 'YP',
  footer_text TEXT DEFAULT 'Thank you for being part of YogaPatha!',
  terms_text TEXT DEFAULT 'This is a computer-generated invoice and does not require a signature.',
  
  -- Brand Colors (RGB format as comma-separated values)
  primary_color TEXT DEFAULT '51,107,110', -- #336b6e
  secondary_color TEXT DEFAULT '187,159,88', -- #bb9f58
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_invoice_settings_updated_at 
  ON invoice_settings(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view invoice settings" ON invoice_settings;
DROP POLICY IF EXISTS "Admins can update invoice settings" ON invoice_settings;
DROP POLICY IF EXISTS "Admins can insert invoice settings" ON invoice_settings;

-- Policy: Anyone can view invoice settings (needed for PDF generation)
CREATE POLICY "Anyone can view invoice settings"
  ON invoice_settings FOR SELECT
  USING (true);

-- Policy: Admins can update invoice settings
CREATE POLICY "Admins can update invoice settings"
  ON invoice_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert invoice settings
CREATE POLICY "Admins can insert invoice settings"
  ON invoice_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_settings_updated_at ON invoice_settings;
CREATE TRIGGER trigger_update_invoice_settings_updated_at
  BEFORE UPDATE ON invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_settings_updated_at();

-- Insert default settings if table is empty
INSERT INTO invoice_settings (
  company_name,
  company_tagline,
  email,
  phone,
  address,
  website,
  invoice_prefix,
  footer_text,
  terms_text,
  primary_color,
  secondary_color
)
SELECT 
  'YogaPatha',
  'Professional Yoga Training Platform',
  'support@yogapatha.com',
  '+91 XXX XXX XXXX',
  'Your Company Address Here',
  'www.yogapatha.com',
  'YP',
  'Thank you for being part of YogaPatha!',
  'This is a computer-generated invoice and does not require a signature.',
  '51,107,110',
  '187,159,88'
WHERE NOT EXISTS (SELECT 1 FROM invoice_settings LIMIT 1);

-- Comments for documentation
COMMENT ON TABLE invoice_settings IS 'Stores invoice configuration and company details for PDF generation';
COMMENT ON COLUMN invoice_settings.company_logo_url IS 'Cloudinary URL for company logo to display on invoices';
COMMENT ON COLUMN invoice_settings.primary_color IS 'RGB color values as comma-separated string (e.g., 51,107,110)';
