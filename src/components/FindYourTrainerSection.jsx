import React, { useState, useEffect, useRef } from 'react'
import {
  Send,
  MapPin,
  Phone,
  Mail,
  User,
  Target,
  CheckCircle2,
  MessageCircle,
  Clock,
  Navigation,
  Loader2,
  Sparkles,
  Home,
  CheckCircle
} from 'lucide-react'
import { SiteContentContext } from '../pages/LandingPage'
import supabase from '../supabase/supabse'
import { sendContactFormConfirmation } from '../utils/emailService'


function FindYourTrainerSection() {
  const siteContent = React.useContext(SiteContentContext) || {}
  const findContent = siteContent.find_your_trainer || {}
  const [isVisible, setIsVisible] = useState(false)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const sectionRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: ''
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Get user's location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.')
      setIsLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Using a reverse geocoding API (OpenStreetMap Nominatim - free service)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )

          if (response.ok) {
            const data = await response.json()
            const address = data.address || {}

            setFormData(prev => ({
              ...prev,
              street: `${address.house_number || ''} ${address.road || ''}`.trim(),
              city: address.city || address.town || address.village || '',
              state: address.state || '',
              pincode: address.postcode || '',
              country: address.country || ''
            }))
          } else {
            setLocationError('Unable to fetch address details.')
          }
        } catch (error) {
          setLocationError('Error fetching location details.')
        } finally {
          setIsLocationLoading(false)
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location. '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permission denied.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Request timeout.'
            break
          default:
            errorMessage += 'Unknown error.'
            break
        }
        setLocationError(errorMessage)
        setIsLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    )
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid'
    }
    if (!formData.street.trim()) errors.street = 'Street address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required'
    if (!formData.country.trim()) errors.country = 'Country is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.from('clients')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country
          }
        ])

      if (error) {
        console.error('Error inserting client:', error)
        setIsSubmitting(false)
        setSubmitSuccess(false)
        return
      }


      // Send confirmation email to client
      try {
        const emailResult = await sendContactFormConfirmation(formData.email, {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          subject: 'Find Your Trainer Inquiry',
          message: `Location: ${formData.city}, ${formData.state}`,
          inquiryType: 'trainer_search'
        })
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError)
        // Don't fail the submission if email fails
      }

      setSubmitSuccess(true)
      setIsSubmitting(false)

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: ''
        })
        setSubmitSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('❌ Submission error:', error)
      setIsSubmitting(false)
      setSubmitSuccess(false)
    }
  }

  return (
    <section ref={sectionRef} id="find_your_trainer" className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e] mb-6">
            {findContent.heading || "Find Your Trainer"}
          </h2>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            {findContent.subtitle || "Ready to start your fitness journey? Fill out the form below and we'll connect you with the perfect certified trainer in your area. Get personalized guidance tailored to your goals."}
          </p>
        </div>

        {/* Form Container */}
        <div className={`bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
          {/* Form Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3]/30 to-transparent pointer-events-none"></div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#336b6e] mb-2">Request Submitted!</h3>
                <p className="text-[#336b6e] opacity-80">We'll connect you with a trainer soon.</p>
              </div>
            </div>
          )}

          <div className="relative z-10">
            {/* Location Button */}
            <div className="mb-8">
              <button
                onClick={getCurrentLocation}
                disabled={isLocationLoading}
                className="flex items-center gap-2 bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocationLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
                {isLocationLoading ? 'Getting Location...' : 'Use My Current Location'}
              </button>

              {locationError && (
                <p className="text-red-500 text-sm mt-2">{locationError}</p>
              )}
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-[#336b6e] font-medium mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.firstName ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your first name"
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-[#336b6e] font-medium mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.lastName ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your last name"
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-[#336b6e] font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.email ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your email"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-[#336b6e] font-medium mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.phone ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your phone number"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-xl font-semibold text-[#336b6e] mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Address Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="street" className="block text-[#336b6e] font-medium mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.street ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your street address"
                    />
                    {formErrors.street && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.street}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-[#336b6e] font-medium mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.city ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Enter your city"
                      />
                      {formErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-[#336b6e] font-medium mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.state ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Enter your state"
                      />
                      {formErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pincode" className="block text-[#336b6e] font-medium mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.pincode ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Enter your pincode"
                      />
                      {formErrors.pincode && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.pincode}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-[#336b6e] font-medium mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.country ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Enter your country"
                      />
                      {formErrors.country && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Find My Trainer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FindYourTrainerSection