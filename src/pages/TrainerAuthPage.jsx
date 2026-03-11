import React, { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Award,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Shield
} from 'lucide-react'
import supabase from '../supabase/supabse'
import ConfirmationPopup from '../components/ConfirmationPopup'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

function TrainerAuthPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin + '/';

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specializations: [],
    experience: '',
    location: '',
    bio: '',
    agreeToTerms: false
  })

  const [loginErrors, setLoginErrors] = useState({})
  const [signupErrors, setSignupErrors] = useState({})

  // Specialization options
  const specializationOptions = [
    'Strength Training',
    'Weight Loss',
    'Cardio Fitness',
    'Yoga',
    'HIIT',
    'Pilates',
    'Athletic Performance',
    'Rehabilitation',
    'Nutrition Counseling',
    'Senior Fitness',
    'Group Training',
    'Online Training'
  ]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Handle login input changes
  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (loginErrors[name]) {
      setLoginErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle signup input changes
  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target
    setSignupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (signupErrors[name]) {
      setSignupErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle specialization toggle
  const toggleSpecialization = (specialization) => {
    setSignupData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }))
  }

  // Validate login form
  const validateLogin = () => {
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

    setLoginErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate signup form
  const validateSignup = () => {
    const errors = {}

    if (!signupData.firstName.trim()) errors.firstName = 'First name is required'
    if (!signupData.lastName.trim()) errors.lastName = 'Last name is required'

    if (!signupData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!signupData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(signupData.phone)) {
      errors.phone = 'Phone number is invalid'
    }

    if (!signupData.password) {
      errors.password = 'Password is required'
    } else if (signupData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number'
    }

    if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (signupData.specializations.length === 0) {
      errors.specializations = 'Please select at least one specialization'
    }

    if (!signupData.experience) errors.experience = 'Experience level is required'
    if (!signupData.location.trim()) errors.location = 'Location is required'
    if (!signupData.bio.trim()) errors.bio = 'Bio is required'
    if (!signupData.agreeToTerms) errors.agreeToTerms = 'You must agree to the terms'

    setSignupErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle login submission
  const handleLogin = async () => {
    if (!validateLogin()) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })

      if (error) {
        throw new Error(error.message)
      }

      // 1. Fetch user role from profiles table (Check if profile exists)
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it (Late Initialization)
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email: data.user.email,
            role: "trainer"
          },
        ]);

        if (insertError) {
          console.error("Late profile creation error:", insertError);
          await supabase.auth.signOut()
          throw new Error('Failed to initialize your profile. Please contact support.')
        }

        // Fetch it again to be sure
        const { data: newProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (fetchError) throw fetchError;
        profileData = newProfile;
      } else if (profileError) {
        await supabase.auth.signOut()
        throw new Error('Unable to verify user role. Please contact support.')
      }

      // 2. Check and initialize trainer_profiles if missing
      const { data: trainerProfile, error: trainerError } = await supabase
        .from('trainer_profiles')
        .select('is_active')
        .eq('user_id', data.user.id)
        .single()

      if (trainerError && trainerError.code === 'PGRST116') {
        // Trainer profile missing, create it
        const { error: insertTrainerError } = await supabase.from("trainer_profiles").insert([
          {
            user_id: data.user.id,
            kyc_status: 'pending',
            is_active: true,
            wants_partnership: false
          },
        ]);

        if (insertTrainerError) {
          console.error("Late trainer profile creation error:", insertTrainerError);
          // We don't necessarily need to fail here if the core profile exists
        }
      } else if (trainerError) {
        console.error('Error checking trainer status:', trainerError)
      }

      // 3. Verify role and status
      if (profileData.role === 'admin') {
        await supabase.auth.signOut()
        throw new Error('Please use the admin login portal.')
      }

      if (profileData.role !== 'trainer') {
        await supabase.auth.signOut()
        throw new Error('Access denied. Trainer credentials required.')
      }

      // Check if trainer account is active (if it was deactivated by admin)
      if (trainerProfile && trainerProfile.is_active === false) {
        await supabase.auth.signOut()
        throw new Error('Your account has been deactivated. Please contact the administrator for assistance.')
      }

      setAuthSuccess(true)

      setTimeout(() => {
        navigate('/trainer_dashboard')
      }, 2000)

    } catch (err) {
      setLoginErrors({ general: err.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle signup submission
  const handleSignup = async () => {
    if (!validateSignup()) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            phone: signupData.phone,
            specializations: signupData.specializations,
            experience: signupData.experience,
            location: signupData.location,
            bio: signupData.bio,
            role: 'trainer',
          },
          emailRedirectTo: `${baseUrl}email_confirmed`
        }
      })

      if (error) {
        console.error(error);
        setSignupErrors({ general: error.message || 'Signup failed. Please try again.' })
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setShowPopup(true);
    } catch (err) {
      console.error("Signup error:", err);
      setSignupErrors({ general: err.message || 'An unexpected error occurred.' })
      setIsLoading(false)
    }

    // firstName: '',
    // lastName: '',
    // email: '',
    // phone: '',
    // password: '',
    // confirmPassword: '',
    // specializations: [],
    // experience: '',
    // location: '',
    // bio: '',
    // certifications: '',
    // agreeToTerms: false

    // try {
    //   // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 3000))
    //   setAuthSuccess(true)

    //   setTimeout(() => {
    //     // Redirect to trainer onboarding
    //   }, 2000)
    // } catch (error) {
    //   console.error('Signup error:', error)
    // } finally {
    //   setIsLoading(false)
    // }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-[#bb9f58] opacity-4 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className={`w-full max-w-2xl relative z-10 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}>
        {/* Success Message */}
        {authSuccess && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center p-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-[#336b6e] mb-4">
                {activeTab === 'login' ? 'Welcome Back!' : 'Registration Successful!'}
              </h3>
              <p className="text-lg text-[#336b6e] opacity-80 mb-2">
                {activeTab === 'login'
                  ? 'Redirecting to your trainer dashboard...'
                  : 'Your trainer profile has been created successfully!'
                }
              </p>
              <div className="flex justify-center mt-6">
                <Loader2 className="w-8 h-8 text-[#bb9f58] animate-spin" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-8 text-center text-white relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#bb9f58] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#336b6e]" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Trainer Portal</h1>
              <p className="text-lg opacity-90">
                {activeTab === 'login'
                  ? 'Welcome back! Sign in to your trainer account'
                  : 'Join our team of expert fitness professionals'
                }
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 relative ${activeTab === 'login'
                ? 'text-[#336b6e] bg-[#fdfcf3]'
                : 'text-gray-500 hover:text-[#336b6e] hover:bg-gray-50'
                }`}
            >
              <Shield className="w-5 h-5 inline-block mr-2" />
              Sign In
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#bb9f58] rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 relative ${activeTab === 'signup'
                ? 'text-[#336b6e] bg-[#fdfcf3]'
                : 'text-gray-500 hover:text-[#336b6e] hover:bg-gray-50'
                }`}
            >
              <Target className="w-5 h-5 inline-block mr-2" />
              Join Our Team
              {activeTab === 'signup' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#bb9f58] rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {activeTab === 'login' ? (
              // Login Form
              <div className="space-y-6">
                {/* General Error Message */}
                {loginErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">Login Failed</h4>
                      <p className="text-sm text-red-700">{loginErrors.general}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[#336b6e] font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${loginErrors.email ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[#336b6e] font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${loginErrors.password ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80 transition-opacity duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginData.rememberMe}
                      onChange={handleLoginChange}
                      className="w-4 h-4 text-[#bb9f58] border-2 border-gray-300 rounded focus:ring-[#bb9f58] focus:border-[#bb9f58]"
                    />
                    <span className="text-[#336b6e]">Remember me</span>
                  </label>

                  <Link to="/forgot_password" className="text-[#bb9f58] hover:text-[#a08a4a] font-medium transition-colors duration-200">
                    Forgot password?
                  </Link>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-[#336b6e] text-[#bb9f58] py-4 px-6 rounded-xl font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-[#336b6e] opacity-80">
                    New trainer?
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold ml-1 transition-colors duration-200"
                    >
                      Join our team
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              // Signup Form
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={signupData.firstName}
                        onChange={handleSignupChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.firstName ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="First name"
                      />
                      {signupErrors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={signupData.lastName}
                        onChange={handleSignupChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.lastName ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Last name"
                      />
                      {signupErrors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type="email"
                          name="email"
                          value={signupData.email}
                          onChange={handleSignupChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.email ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="trainer@email.com"
                        />
                      </div>
                      {signupErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type="tel"
                          name="phone"
                          value={signupData.phone}
                          onChange={handleSignupChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.phone ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      {signupErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={signupData.password}
                          onChange={handleSignupChange}
                          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.password ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80 transition-opacity duration-200"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {signupErrors.password && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={signupData.confirmPassword}
                          onChange={handleSignupChange}
                          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#336b6e] opacity-50 hover:opacity-80 transition-opacity duration-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Professional Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Specializations</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {specializationOptions.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSpecialization(spec)}
                            className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-300 ${signupData.specializations.includes(spec)
                              ? 'bg-[#336b6e] text-[#bb9f58] border-[#336b6e]'
                              : 'bg-white text-[#336b6e] border-gray-200 hover:border-[#bb9f58]'
                              }`}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                      {signupErrors.specializations && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.specializations}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Experience Level</label>
                        <select
                          name="experience"
                          value={signupData.experience}
                          onChange={handleSignupChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.experience ? 'border-red-500' : 'border-gray-200'
                            }`}
                        >
                          <option value="">Select experience level</option>
                          <option value="1-2 years">1-2 years</option>
                          <option value="3-5 years">3-5 years</option>
                          <option value="5-10 years">5-10 years</option>
                          <option value="10+ years">10+ years</option>
                        </select>
                        {signupErrors.experience && (
                          <p className="text-red-500 text-sm mt-1">{signupErrors.experience}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                          <input
                            type="text"
                            name="location"
                            value={signupData.location}
                            onChange={handleSignupChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${signupErrors.location ? 'border-red-500' : 'border-gray-200'
                              }`}
                            placeholder="City, State"
                          />
                        </div>
                        {signupErrors.location && (
                          <p className="text-red-500 text-sm mt-1">{signupErrors.location}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Professional Bio</label>
                      <textarea
                        name="bio"
                        value={signupData.bio}
                        onChange={handleSignupChange}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 resize-vertical ${signupErrors.bio ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Tell us about your training philosophy, experience, and what makes you unique as a trainer..."
                      />
                      {signupErrors.bio && (
                        <p className="text-red-500 text-sm mt-1">{signupErrors.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={signupData.agreeToTerms}
                      onChange={handleSignupChange}
                      className={`w-5 h-5 text-[#bb9f58] border-2 rounded focus:ring-[#bb9f58] focus:border-[#bb9f58] mt-1 ${signupErrors.agreeToTerms ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    <span className="text-[#336b6e] text-sm leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold">
                        Terms of Service
                      </a>
                      ,{' '}
                      <a href="#" className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold">
                        Privacy Policy
                      </a>
                      , and{' '}
                      <a href="#" className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold">
                        Trainer Code of Conduct
                      </a>
                      . I understand that my application will be reviewed and I may be contacted for additional verification.
                    </span>
                  </label>
                  {signupErrors.agreeToTerms && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {signupErrors.agreeToTerms}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="w-full bg-[#336b6e] text-[#bb9f58] py-4 px-6 rounded-xl font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creating Your Profile...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Join Our Trainer Team
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-[#336b6e] opacity-80">
                    Already have an account?
                    <button
                      onClick={() => setActiveTab('login')}
                      className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold ml-1 transition-colors duration-200"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-r from-[#fdfcf3] to-white p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[#336b6e]">
                <Shield className="w-5 h-5 text-[#bb9f58]" />
                <span className="text-sm font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#336b6e]">
                <CheckCircle className="w-5 h-5 text-[#bb9f58]" />
                <span className="text-sm font-medium">Verified Trainers</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#336b6e]">
                <Target className="w-5 h-5 text-[#bb9f58]" />
                <span className="text-sm font-medium">Career Growth</span>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-[#336b6e] opacity-60">
                By joining our platform, you'll have access to client management tools,
                scheduling systems, and ongoing professional development opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-[#336b6e] opacity-80 mb-4">
            Need help? Contact our trainer support team
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="mailto:trainers@fitnesscompany.com"
              className="text-[#bb9f58] hover:text-[#a08a4a] font-medium transition-colors duration-200 flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <a
              href="tel:+15551234567"
              className="text-[#bb9f58] hover:text-[#a08a4a] font-medium transition-colors duration-200 flex items-center gap-1"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
          </div>
        </div>
      </div>
      <ConfirmationPopup
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  )
}

export default TrainerAuthPage