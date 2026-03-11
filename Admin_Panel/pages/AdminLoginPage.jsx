import React, { useState, useEffect } from 'react'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Key,
  Fingerprint
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { useNavigate } from 'react-router-dom'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [error, setError] = useState('')

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
    setError('')
  }

  const validateForm = () => {
    const errors = {}
    
    if (!loginData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required'
    } else if (loginData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      // Fetch user role from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        await supabase.auth.signOut()
        throw new Error('Unable to verify user role. Please contact support.')
      }

      // Check if user has admin role
      if (profileData.role !== 'admin') {
        // Sign out the user if they're not an admin
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin credentials required.')
      }

      setLoginSuccess(true)
      
      setTimeout(() => {
        navigate('/admin_dashboard')
      }, 2000)
      
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] via-[#fdfcf3] to-[#f8f6e8] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-[#bb9f58] opacity-4 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Login Card */}
      <div className={`w-full max-w-md relative z-10 transform transition-all duration-1000 ease-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        
        {/* Success Overlay */}
        {loginSuccess && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center p-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-[#336b6e] mb-4">Welcome Back, Admin!</h3>
              <p className="text-lg text-[#336b6e] opacity-80 mb-4">
                Login successful. Redirecting to dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-[#bb9f58] animate-spin" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-8 text-center text-white relative overflow-hidden">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-[#bb9f58] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShieldCheck className="w-10 h-10 text-[#336b6e]" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
              <p className="text-lg opacity-90">Secure Access Panel</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <div className="space-y-6">
              
              {/* Security Notice */}
              <div className="bg-gradient-to-br from-[#fdfcf3] to-white p-4 rounded-xl border border-[#bb9f58]/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#bb9f58] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#336b6e] text-sm mb-1">
                      Authorized Access Only
                    </h3>
                    <p className="text-xs text-[#336b6e] opacity-70">
                      This area is restricted to administrators. All login attempts are monitored and logged.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 text-sm mb-1">Login Failed</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-[#336b6e] font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-lg ${
                      formErrors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[#336b6e] font-semibold mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-lg ${
                      formErrors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your admin password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80 transition-opacity duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#bb9f58] border-2 border-gray-300 rounded focus:ring-[#bb9f58] focus:border-[#bb9f58]"
                  />
                  <span className="text-[#336b6e] text-sm group-hover:text-[#2a5557] transition-colors duration-200">
                    Remember me
                  </span>
                </label>
                
                <a href="#" className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold text-sm transition-colors duration-200">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-[#bb9f58] py-4 px-6 rounded-xl font-bold text-lg hover:from-[#2a5557] hover:to-[#1f4244] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    Admin Sign In
                  </>
                )}
              </button>

              {/* Security Features */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#336b6e] mb-3 text-center">
                  Security Features
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-5 h-5 text-[#336b6e]" />
                    </div>
                    <p className="text-xs text-[#336b6e] opacity-70">SSL Encrypted</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Fingerprint className="w-5 h-5 text-[#336b6e]" />
                    </div>
                    <p className="text-xs text-[#336b6e] opacity-70">2FA Ready</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Key className="w-5 h-5 text-[#336b6e]" />
                    </div>
                    <p className="text-xs text-[#336b6e] opacity-70">Token Based</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-[#fdfcf3] to-white p-6 border-t border-gray-100 text-center">
            <p className="text-xs text-[#336b6e] opacity-60 mb-2">
              Protected by enterprise-grade security
            </p>
            <p className="text-xs text-[#336b6e] opacity-60">
              © 2024 Fitness Company Admin Portal. All rights reserved.
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-[#336b6e] opacity-80 text-sm mb-3">
            Having trouble accessing your admin account?
          </p>
          <div className="flex justify-center gap-6">
            <a 
              href="mailto:admin-support@fitnesscompany.com" 
              className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold text-sm transition-colors duration-200 flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Contact IT Support
            </a>
            <a 
              href="tel:+15551234567" 
              className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold text-sm transition-colors duration-200 flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              Security Team
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage