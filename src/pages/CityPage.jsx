import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  ArrowLeft,
  CheckCircle,
  Phone,
  Award,
  Shield,
  Star,
  Home,
  Loader2
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { fetchIndianStates } from '../data/locationsData'
import supabase from '../supabase/supabse'
import SEO from '../components/SEO'

function CityPage() {
  const { stateSlug, citySlug } = useParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [city, setCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    loadCity()
    loadServices()
  }, [stateSlug, citySlug])

  const loadCity = async () => {
    setLoading(true)
    const states = await fetchIndianStates()
    const foundState = states.find(s => s.slug === stateSlug)

    if (!foundState) {
      navigate('/locations')
      return
    }

    const foundCity = foundState.cities.find(c => c.slug === citySlug)

    if (!foundCity) {
      navigate(`/locations/${stateSlug}`)
      return
    }

    setCity({ ...foundCity, state: foundState.name, stateSlug: foundState.slug })
    setIsVisible(true)
    setLoading(false)
    window.scrollTo(0, 0)
  }

  const loadServices = async () => {
    try {
      setServicesLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices([])
    } finally {
      setServicesLoading(false)
    }
  }

  // Map service category to icon and color
  const getServiceIcon = (category) => {
    const iconMap = {
      'Personal': { icon: 'Home', color: 'from-blue-500 to-blue-600' },
      'Group': { icon: 'Users', color: 'from-purple-500 to-purple-600' },
      'Cardio': { icon: 'Heart', color: 'from-red-500 to-red-600' },
      'Yoga': { icon: 'Sparkles', color: 'from-teal-500 to-teal-600' },
      'Strength': { icon: 'Dumbbell', color: 'from-orange-500 to-orange-600' },
      'Wellness': { icon: 'Brain', color: 'from-indigo-500 to-indigo-600' }
    }
    return iconMap[category] || { icon: 'Star', color: 'from-gray-500 to-gray-600' }
  }

  const siteUrl = 'https://www.yogapatha.in'
  const pageUrl = `${siteUrl}/locations/${stateSlug}/${citySlug}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fdfcf3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#336b6e]" />
      </div>
    )
  }

  if (!city) {
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone number must be 10 digits'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('booking_queries')
        .insert([{
          first_name: formData.name.split(' ')[0],
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          city: city.name,
          state: city.state,
          source: 'City Landing Page'
        }])

      if (error) throw error

      setSubmitSuccess(true)

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      })

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('Failed to submit inquiry. Please try again or contact us via WhatsApp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsAppClick = (serviceName) => {
    const whatsappNumber = city.whatsapp_number || '+919876543210'
    const message = city.whatsapp_message
      ? city.whatsapp_message.replace('{serviceName}', serviceName)
      : `Hi, I'm interested in ${serviceName} Yoga service in ${city.name}, ${city.state}. Please share complete details and availability.`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCallClick = () => {
    window.location.href = `tel:${city.whatsapp_number || '+919876543210'}`
  }

  const handleConsultationClick = () => {
    const whatsappNumber = city.whatsapp_number || '+919876543210'
    const message = `Hi, I need a personalized yoga program in ${city.name}, ${city.state}. Please schedule a free consultation session.`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#fdfcf3]">
      <SEO
        title={`Yoga Teacher at Home in ${city.name}, ${city.state} | Personal & Online Yoga Classes`}
        description={`Find certified yoga teachers at home or online in ${city.name}, ${city.state}. Beginners, seniors, pre postnatal, therapy, weight loss, and corporate yoga sessions available.`}
        keywords={`yoga teacher ${city.name}, yoga at home ${city.name}, personal yoga trainer ${city.name}, online yoga classes ${city.name}, yoga instructor ${city.name}`}
        ogImage="/logo.png"
        canonicalUrl={pageUrl}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Breadcrumb */}
            <div className="flex items-center text-sm mb-6 space-x-2">
              <Link to="/locations" className="hover:text-[#bb9f58] transition-colors">
                Locations
              </Link>
              <span>/</span>
              <Link to={`/locations/${stateSlug}`} className="hover:text-[#bb9f58] transition-colors">
                {city.state}
              </Link>
              <span>/</span>
              <span className="text-[#bb9f58]">{city.name}</span>
            </div>

            <Link
              to={`/locations/${stateSlug}`}
              className="inline-flex items-center text-white hover:text-[#bb9f58] transition-colors mb-6 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to {city.state}</span>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Yoga & Fitness Training in {city.name}
            </h1>
            <div className="flex items-center text-gray-200">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="text-lg">{city.name}, {city.state}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-6">
            Transform Your Life with Expert Yoga & Fitness Training
          </h2>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-8 leading-relaxed">
            Discover personalized yoga and fitness programs in <span className="font-semibold text-[#336b6e]">{city.name}, {city.state}</span>.
            Our certified trainers bring professional guidance right to your doorstep, helping you achieve your wellness goals
            with customized sessions designed just for you.
          </p>

        </div>
      </div>

      {/* Combined CTA and Contact Form Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Benefits & CTA Buttons */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#336b6e] mb-6">
                Get Started with Your Fitness Journey in {city.name}
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Transform your health and wellness with personalized yoga and fitness programs designed just for you.
              </p>

              {/* Key Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-[#336b6e] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Certified Trainers</h4>
                    <p className="text-gray-600">Expert instructors with international certifications</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-[#336b6e] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">At Your Doorstep</h4>
                    <p className="text-gray-600">Convenient home sessions across {city.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-[#336b6e] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Personalized Plans</h4>
                    <p className="text-gray-600">Custom programs tailored to your fitness level</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-[#336b6e] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Flexible Scheduling</h4>
                    <p className="text-gray-600">Choose times that work best for your routine</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleWhatsAppClick('General Inquiry')}
                  className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white px-6 py-3 rounded-lg font-bold hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                >
                  <Phone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  WhatsApp Us
                </button>
                <button
                  onClick={handleCallClick}
                  className="bg-[#336b6e] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2a5557] transition-colors duration-200 flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </button>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-[#336b6e] mb-6">
                Request a Free Consultation
              </h3>

              {submitSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">Success!</p>
                    <p className="text-green-700 text-sm">We've received your inquiry and will contact you soon.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none ${formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="10-digit mobile number"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none resize-none"
                    placeholder="Tell us about your fitness goals..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#336b6e] text-white px-6 py-4 rounded-lg font-semibold hover:bg-[#2a5557] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#336b6e] mb-4">
            Book Yoga Services in {city.name}
          </h2>
        </div>

        {servicesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#336b6e]" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const { icon: iconName, color } = getServiceIcon(service.category)
              const IconComponent = Icons[iconName] || Icons.Star

              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`h-2 bg-gradient-to-r ${color}`}></div>

                  {/* Service Image (optional) */}
                  {service.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-full flex items-center justify-center mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#336b6e] mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4 min-h-[60px]">
                      {service.description}
                    </p>

                    {/* Service Details */}
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      {service.price && (
                        <span className="font-semibold text-[#336b6e]">{service.price}</span>
                      )}
                      {service.duration && (
                        <span>{service.duration}</span>
                      )}
                      {service.rating && (
                        <span className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                          {service.rating}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleWhatsAppClick(service.title)}
                      className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
                    >
                      <Phone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      Book on WhatsApp
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#336b6e] mb-2">
                Certified & Verified
              </h3>
              <p className="text-gray-600 text-sm">
                All instructors are background verified and certified by international yoga alliances
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#336b6e] mb-2">
                Home Service
              </h3>
              <p className="text-gray-600 text-sm">
                Professional setup at your location across {city?.name || 'your city'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#336b6e] mb-2">
                Premium Quality
              </h3>
              <p className="text-gray-600 text-sm">
                5-star rated service with personalized attention and professional equipment
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#336b6e] mb-2">
                Trusted by Thousands
              </h3>
              <p className="text-gray-600 text-sm">
                Join 8000+ happy clients who transformed their lives with our expert trainers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Personalized Yoga Program?
          </h2>
          <p className="text-gray-200 mb-8 text-lg">
            Get a custom-designed yoga plan tailored to your goals and schedule in {city.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleConsultationClick}
              className="bg-[#bb9f58] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#a68a4a] transition-colors duration-200 flex items-center justify-center"
            >
              <Phone className="w-6 h-6 mr-2" />
              Free Consultation
            </button>
            <button
              onClick={handleCallClick}
              className="bg-white text-[#336b6e] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
            >
              <Phone className="w-6 h-6 mr-2" />
              Call Expert
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#fdfcf3] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#336b6e] mb-2">
                {city.client_count || '120'}+
              </div>
              <p className="text-gray-600">Happy Clients in {city.name}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#336b6e] mb-2">
                {city.session_count || '450'}+
              </div>
              <p className="text-gray-600">Sessions Completed</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#336b6e] mb-2">10+</div>
              <p className="text-gray-600">Years Experience</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#336b6e] mb-2">
                {city.review_count || '150'}+
              </div>
              <p className="text-gray-600">5-Star Reviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CityPage
