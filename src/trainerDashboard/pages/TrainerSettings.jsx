import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Shield,
  Key
} from 'lucide-react'
import supabase from '../../supabase/supabse'
import { useOutletContext } from 'react-router-dom'

function TrainerSettings() {
  const { userData } = useOutletContext()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  })

  // Password reset data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  useEffect(() => {
    if (userData) {
      setProfileData({
        firstName: userData.user_metadata?.firstName || '',
        lastName: userData.user_metadata?.lastName || '',
        email: userData.email || '',
        phone: userData.user_metadata?.phone || '',
        location: userData.user_metadata?.location || '',
        bio: userData.user_metadata?.bio || ''
      })
    }
  }, [userData])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validatePasswordReset = () => {
    const errors = {}
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (!validatePasswordReset()) return
    
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: passwordData.currentPassword
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccessMessage('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
      
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 5000)
      
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-lg text-white/80">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#bb9f58]" />
            Profile Information
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type="text"
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all resize-vertical"
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-xl font-semibold hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Reset */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#bb9f58]" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all ${
                    passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                New Password
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#336b6e] mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-[#fdfcf3] rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-[#336b6e] mb-2">Password Requirements:</h4>
              <ul className="text-xs text-[#336b6e] space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#bb9f58] rounded-full"></div>
                  At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#bb9f58] rounded-full"></div>
                  Contains uppercase and lowercase letters
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#bb9f58] rounded-full"></div>
                  Contains at least one number
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-xl font-semibold hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TrainerSettings
