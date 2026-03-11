import { useState, useEffect } from 'react'
import { Save, Upload, AlertCircle, CheckCircle, Loader, Image as ImageIcon } from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function AdminInvoiceSettings() {
  const [settings, setSettings] = useState({
    company_name: 'YogaPatha',
    company_tagline: 'Professional Yoga Training Platform',
    company_logo_url: '',
    email: 'support@yogapatha.com',
    phone: '+91 XXX XXX XXXX',
    address: 'Your Company Address Here',
    website: 'www.yogapatha.com',
    invoice_prefix: 'YP',
    footer_text: 'Thank you for being part of YogaPatha!',
    terms_text: 'This is a computer-generated invoice and does not require a signature.',
    primary_color: '51,107,110',
    secondary_color: '187,159,88'
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'yogapatha_media')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Upload failed')
      }

      const data = await response.json()
      handleChange('company_logo_url', data.secure_url)
      showMessage('success', 'Logo uploaded successfully')
    } catch (error) {
      console.error('Error uploading logo:', error)
      showMessage('error', error.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const settingsData = {
        ...settings,
        updated_by: user?.id
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from('invoice_settings')
        .select('id')
        .limit(1)
        .single()

      let error
      if (existing) {
        // Update existing
        const result = await supabase
          .from('invoice_settings')
          .update(settingsData)
          .eq('id', existing.id)
        error = result.error
      } else {
        // Insert new
        const result = await supabase
          .from('invoice_settings')
          .insert([settingsData])
        error = result.error
      }

      if (error) throw error

      showMessage('success', 'Settings saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-[#336b6e]" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#336b6e]">Invoice Settings</h1>
          <p className="text-gray-600 mt-2">Configure company details for invoice generation</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Company Details Section */}
          <div>
            <h2 className="text-xl font-bold text-[#336b6e] mb-4">Company Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.company_tagline}
                  onChange={(e) => handleChange('company_tagline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={settings.invoice_prefix}
                  onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  placeholder="YP"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.company_logo_url && (
                  <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={settings.company_logo_url}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-[#336b6e] text-[#336b6e] rounded-lg hover:bg-[#336b6e] hover:text-white transition-colors cursor-pointer ${
                      uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Logo
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Max 2MB, PNG or JPG</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-[#336b6e] mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Invoice Customization Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-[#336b6e] mb-4">Invoice Customization</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions Text
                </label>
                <textarea
                  value={settings.terms_text}
                  onChange={(e) => handleChange('terms_text', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color (RGB)
                  </label>
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    placeholder="51,107,110"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: R,G,B (e.g., 51,107,110)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color (RGB)
                  </label>
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    placeholder="187,159,88"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#336b6e]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: R,G,B (e.g., 187,159,88)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminInvoiceSettings
