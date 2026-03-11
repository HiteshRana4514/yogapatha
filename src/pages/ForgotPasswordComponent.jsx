import React, { useState, useEffect } from 'react'
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import supabase from '../supabase/supabse'
import { useNavigate, Link } from 'react-router-dom'

function ForgotPasswordComponent({ onBackToLogin }) {
  const [step, setStep] = useState('request') // 'request', 'sent', 'reset'
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin + '/';
  useEffect(() => {
    setIsVisible(true)

    // Check if we're on the reset password page (check URL params for reset token)
    const urlParams = new URLSearchParams(window.location.search)
    const resetToken = urlParams.get('token') || urlParams.get('reset_token')

    if (resetToken) {
      setStep('reset')
    }
  }, [])

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 8 &&
      /(?=.*[a-z])/.test(password) &&
      /(?=.*[A-Z])/.test(password) &&
      /(?=.*\d)/.test(password)
  }

  const handleForgotPassword = async () => {
    setError('')

    if (!email.trim()) {
      setError('Email address is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    const { data, error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}forgot_password?token={token}`
    })

    if (supabaseError) {
      setError(supabaseError.message || 'An error occurred while sending the reset email')
      setIsLoading(false)
      return
    }
    else {
      setIsLoading(false)
      setStep('sent')
      setCountdown(60) // 60 seconds before allowing resend
      return
    }

  }

  const handleResendEmail = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    setError('')

    try {
      // TODO: Replace with your API call for resending email
      // const response = await fetch('/api/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // })

      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500))

      setCountdown(60)

    } catch (err) {
      setError(err.message || 'An error occurred while resending the email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')

    if (!newPassword) {
      setError('New password is required')
      return
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      setError(error.message || 'An error occurred while updating your password')
      setIsLoading(false)
    }
    else {
      setSuccess(true)
      setIsLoading(false)
      setTimeout(() => {
        navigate('/trainer_login')
      }, 3000)
    }
  }

  const renderRequestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-[#bb9f58]" />
        </div>
        <h2 className="text-3xl font-bold text-[#336b6e] mb-4">Forgot Password?</h2>
        <p className="text-lg text-[#336b6e] opacity-80 leading-relaxed">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <label className="block text-[#336b6e] font-medium mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-lg ${error ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="trainer@example.com"
            disabled={isLoading}
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      <button
        onClick={handleForgotPassword}
        disabled={isLoading}
        className="w-full bg-[#336b6e] text-[#bb9f58] py-4 px-6 rounded-xl font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Reset Link...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Reset Link
          </>
        )}
      </button>

      <div className="text-center">
        <Link
          to='/trainer_login'
          className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  )

  const renderSentStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-[#336b6e] mb-4">Check Your Email!</h2>
        <p className="text-lg text-[#336b6e] opacity-80 mb-2">
          We've sent a password reset link to:
        </p>
        <p className="text-xl font-semibold text-[#bb9f58] mb-6">{email}</p>
        <p className="text-[#336b6e] opacity-70 text-sm leading-relaxed">
          Click the link in the email to reset your password. If you don't see the email,
          check your spam folder or try resending below.
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#fdfcf3] to-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-center gap-2 text-[#336b6e] mb-4">
          <Shield className="w-5 h-5 text-[#bb9f58]" />
          <span className="font-semibold">Security Note</span>
        </div>
        <p className="text-sm text-[#336b6e] opacity-80">
          The reset link will expire in 1 hour for security reasons.
          Make sure to use it soon after receiving the email.
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-sm flex items-center justify-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      <div className="space-y-4">
        <button
          onClick={handleResendEmail}
          disabled={isLoading || countdown > 0}
          className="w-full bg-[#bb9f58] text-[#336b6e] py-3 px-6 rounded-xl font-semibold hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Resending...
            </>
          ) : countdown > 0 ? (
            <>
              <RefreshCw className="w-5 h-5" />
              Resend in {countdown}s
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Resend Email
            </>
          )}
        </button>

        <button
          onClick={() => setStep('request')}
          className="w-full text-[#336b6e] hover:text-[#2a5557] font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Try Different Email
        </button>
      </div>
    </div>
  )

  const renderResetStep = () => (
    <div className="space-y-6">
      {success ? (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#336b6e] mb-4">Password Updated!</h2>
            <p className="text-lg text-[#336b6e] opacity-80 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-[#bb9f58] animate-spin" />
            </div>
            <p className="text-sm text-[#336b6e] opacity-60 mt-2">
              Redirecting to sign in page...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#bb9f58]" />
            </div>
            <h2 className="text-3xl font-bold text-[#336b6e] mb-4">Set New Password</h2>
            <p className="text-lg text-[#336b6e] opacity-80">
              Enter your new password below. Make sure it's strong and secure!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[#336b6e] font-medium mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-lg"
                  placeholder="Enter your new password"
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
            </div>

            <div>
              <label className="block text-[#336b6e] font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-lg"
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80 transition-opacity duration-200"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-br from-[#fdfcf3] to-white p-4 rounded-xl border border-gray-100">
              <h4 className="font-semibold text-[#336b6e] mb-2 text-sm">Password Requirements:</h4>
              <ul className="space-y-1 text-xs text-[#336b6e] opacity-70">
                <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  One lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  One uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                  One number
                </li>
              </ul>
            </div>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full bg-[#336b6e] text-[#bb9f58] py-4 px-6 rounded-xl font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className={`w-full max-w-md relative z-10 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {step === 'request' && renderRequestStep()}
            {step === 'sent' && renderSentStep()}
            {step === 'reset' && renderResetStep()}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-[#fdfcf3] to-white p-6 border-t border-gray-100 text-center">
            <p className="text-xs text-[#336b6e] opacity-60">
              Having trouble? Contact our support team at{' '}
              <a href="mailto:support@fitnesscompany.com" className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold">
                support@fitnesscompany.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordComponent