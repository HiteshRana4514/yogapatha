import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Loader2,
  Navigation,
  Building,
  Users,
  Heart
} from 'lucide-react'
import supabase from '../supabase/supabse'
import { sendContactFormConfirmation } from '../utils/emailService'
import BookingModal from '../components/BookingModal'
import SEO from '../components/SEO'

const iconMap = {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Navigation,
  MapPin,
  Clock,
  Building,
  Users,
  Heart
}

function ContactUsPage() {
  const [siteContent, setSiteContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [visibleSections, setVisibleSections] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const sectionRef = useRef(null)

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
    inquiryType: 'general'
  })

  const [formErrors, setFormErrors] = useState({})

  // Fetch dynamic content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('section_name, content')
          .eq('page_name', 'contact_us')

        if (error) throw error

        const contentMap = {}
        data.forEach(item => {
          contentMap[item.section_name] = item.content
        })
        setSiteContent(contentMap)
      } catch (error) {
        console.error('Error fetching site content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  const heroContent = siteContent.hero || {
    heading_main: "Get In",
    heading_highlight: "Touch",
    subtitle: "Ready to start your fitness journey? We're here to help you every step of the way. Reach out to us through any of the methods below or visit one of our locations."
  }

  // Multiple locations data
  const locations = siteContent.locations || [
    {
      id: 1,
      name: "Downtown Fitness Center",
      address: "123 Main Street, Downtown District, City 12345",
      phone: "+1 (555) 123-4567",
      email: "downtown@fitnesscompany.com",
      hours: {
        weekdays: "6:00 AM - 10:00 PM",
        saturday: "7:00 AM - 9:00 PM",
        sunday: "8:00 AM - 8:00 PM"
      },
      coordinates: { lat: 40.7128, lng: -74.0060 },
      features: ["Personal Training", "Group Classes", "Nutrition Counseling"],
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 2,
      name: "Westside Wellness Hub",
      address: "456 Oak Avenue, Westside, City 12346",
      phone: "+1 (555) 234-5678",
      email: "westside@fitnesscompany.com",
      hours: {
        weekdays: "5:30 AM - 10:30 PM",
        saturday: "6:00 AM - 10:00 PM",
        sunday: "7:00 AM - 9:00 PM"
      },
      coordinates: { lat: 40.7589, lng: -73.9851 },
      features: ["Yoga Studio", "HIIT Classes", "Recovery Services"],
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 3,
      name: "Eastside Athletic Center",
      address: "789 Pine Road, Eastside, City 12347",
      phone: "+1 (555) 345-6789",
      email: "eastside@fitnesscompany.com",
      hours: {
        weekdays: "6:00 AM - 9:00 PM",
        saturday: "7:00 AM - 8:00 PM",
        sunday: "8:00 AM - 7:00 PM"
      },
      coordinates: { lat: 40.6892, lng: -74.0445 },
      features: ["Strength Training", "Athletic Performance", "Sports Therapy"],
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    }
  ]

  // Contact methods
  const contactMethods = siteContent.methods || [
    {
      icon: "Phone",
      title: "Call Us",
      description: "Speak directly with our team",
      action: "tel:+15551234567",
      value: "+1 (555) 123-4567",
      color: "from-[#336b6e] to-[#2a5557]"
    },
    {
      icon: "Mail",
      title: "Email Us",
      description: "Send us a detailed message",
      action: "mailto:info@fitnesscompany.com",
      value: "info@fitnesscompany.com",
      color: "from-[#bb9f58] to-[#a08a4a]"
    },
    {
      icon: "MessageCircle",
      title: "Live Chat",
      description: "Get instant support online",
      action: "#",
      value: "Available 9 AM - 6 PM",
      color: "from-[#336b6e] to-[#bb9f58]"
    },
    {
      icon: "Calendar",
      title: "Book Consultation",
      description: "Schedule a free consultation",
      action: "#",
      value: "Free 30-min session",
      color: "from-[#2a5557] to-[#336b6e]"
    }
  ]

  const infoCardsContent = siteContent.info_cards || {
    heading: "Let's Connect",
    description: "We're excited to help you achieve your fitness goals. Whether you're just starting out or looking to take your training to the next level, our team is here to support you.",
    cards: [
      {
        icon: "Phone",
        title: "Call Us",
        subtitle: "Monday - Friday: 6 AM - 10 PM",
        value: "+1 (555) 123-4567",
        action: "tel:+15551234567",
        color: "from-[#336b6e] to-[#2a5557]"
      },
      {
        icon: "Mail",
        title: "Email Us",
        subtitle: "We'll respond within 24 hours",
        value: "info@fitnesscompany.com",
        action: "mailto:info@fitnesscompany.com",
        color: "from-[#bb9f58] to-[#a08a4a]"
      },
      {
        icon: "Navigation",
        title: "Visit Us",
        subtitle: "3 convenient locations to serve you",
        value: "See locations below",
        color: "from-[#336b6e] to-[#bb9f58]"
      }
    ],
    promise: {
      title: "Quick Response Promise",
      items: [
        "Phone calls answered during business hours",
        "Email responses within 24 hours",
        "Emergency support available 24/7",
        "Same-day consultation booking available"
      ]
    }
  }

  const ctaContent = siteContent.cta || {
    heading: "Ready to Transform Your Life?",
    subtitle: "Don't wait any longer to start your fitness journey. Contact us today and take the first step towards a healthier, stronger, more confident you.",
    button_1: "Book Free Consultation",
    button_2: "Call Now: +1 (555) 123-4567"
  }

  // No longer using Google Maps JS API, using iframes instead

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Animate sections
  useEffect(() => {
    if (isVisible) {
      const sections = ['hero', 'methods', 'form', 'locations', 'map']
      sections.forEach((section, index) => {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, section])
        }, index * 200)
      })
    }
  }, [isVisible])

  const isSectionVisible = (section) => visibleSections.includes(section)

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      // 1. Save to Supabase
      const { error: supabaseError } = await supabase
        .from('booking_queries')
        .insert([{
          first_name: formData.name.split(' ')[0] || 'N/A',
          last_name: formData.name.split(' ').slice(1).join(' ') || 'N/A',
          email: formData.email,
          phone: formData.phone || 'N/A',
          message: `Subject: ${formData.subject}\n\n${formData.message}`,
          service_title: `General Inquiry: ${formData.inquiryType}`,
          status: 'pending'
        }])

      if (supabaseError) throw supabaseError

      // 2. Send confirmation email to client
      try {
        await sendContactFormConfirmation(formData.email, formData)
      } catch (emailError) {
        console.error('❌ Email confirmation error:', emailError)
        // We don't throw here so the user still sees success
      }

      setSubmitSuccess(true)

      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          preferredContact: 'email',
          inquiryType: 'general'
        })
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('❌ Submission error:', error)
      alert('Failed to send message: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid'
    if (!formData.subject.trim()) errors.subject = 'Subject is required'
    if (!formData.message.trim()) errors.message = 'Message is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleWhatsAppConnect = () => {
    const phoneNumber = '919876543210' // Replace with your WhatsApp business number
    const message = `Hi! I'm interested in starting my fitness journey with YogaPatha. Could you please provide more details?`
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <>
      <SEO
        title="Contact Us | Inquiry & Support - YogaPatha"
        description="Have questions? Get in touch with YogaPatha for inquiries about yoga classes, teacher training, or partnerships. We're here to help you start your journey."
        keywords="contact yoga patha, yoga inquiry, support, yoga training help, fitness consultation"
        canonicalUrl="https://www.yogapatha.in/contact_us"
      />
      <div ref={sectionRef} className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white">
        {/* Hero Section */}
        <section className={`py-24 md:py-32 relative overflow-hidden transform transition-all duration-1000 ease-out ${isSectionVisible('hero') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-16 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
            <div className="absolute bottom-32 right-20 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#336b6e] mb-8 leading-tight">
                {heroContent.heading_main}
                <span className="block bg-gradient-to-r from-[#336b6e] to-[#bb9f58] bg-clip-text text-transparent">
                  {heroContent.heading_highlight}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-[#336b6e] opacity-80 max-w-4xl mx-auto leading-relaxed">
                {heroContent.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className={`py-16 bg-white transform transition-all duration-1000 ease-out ${isSectionVisible('methods') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactMethods.map((method, index) => {
                const IconComponent = iconMap[method.icon] || Phone
                return (
                  <div
                    key={index}
                    className="group bg-gradient-to-br from-[#fdfcf3] to-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 text-center"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#336b6e] mb-3 group-hover:text-[#2a5557] transition-colors duration-300">
                      {method.title}
                    </h3>
                    <p className="text-[#336b6e] opacity-80 mb-4">{method.description}</p>
                    {method.title?.toLowerCase().includes('call us') ? (
                      <div className="flex flex-col gap-2">
                        {(method.value || '').split(',').map((num, nIdx) => (
                          num.trim() && (
                            <a
                              key={nIdx}
                              href={`tel:${num.trim().replace(/\s+/g, '')}`}
                              className="text-[#bb9f58] font-semibold hover:underline"
                            >
                              {num.trim()}
                            </a>
                          )
                        ))}
                      </div>
                    ) : (
                      <a href={method.action} className="text-[#bb9f58] font-semibold hover:underline">
                        {method.value}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className={`py-24 transform transition-all duration-1000 ease-out ${isSectionVisible('form') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} id='contact-form'>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3]/30 to-transparent pointer-events-none"></div>

                {/* Success Message */}
                {submitSuccess && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#336b6e] mb-2">Message Sent!</h3>
                      <p className="text-[#336b6e] opacity-80">We'll get back to you soon.</p>
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-[#336b6e] mb-8">Send us a Message</h2>

                  <div className="space-y-6">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.name ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Enter your full name"
                        />
                        {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.email ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="Enter your email"
                        />
                        {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Subject *</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 ${formErrors.subject ? 'border-red-500' : 'border-gray-200'
                            }`}
                          placeholder="What's this about?"
                        />
                        {formErrors.subject && <p className="text-red-500 text-sm mt-1">{formErrors.subject}</p>}
                      </div>
                    </div>

                    {/* Inquiry Type & Preferred Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Inquiry Type</label>
                        <select
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300"
                        >
                          <option value="general">General Information</option>
                          <option value="personal-training">Personal Training</option>
                          <option value="group-classes">Group Classes</option>
                          <option value="nutrition">Nutrition Counseling</option>
                          <option value="membership">Membership</option>
                          <option value="partnership">Partnership</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#336b6e] font-medium mb-2">Preferred Contact</label>
                        <select
                          name="preferredContact"
                          value={formData.preferredContact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300"
                        >
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="text">Text Message</option>
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[#336b6e] font-medium mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={5}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 resize-vertical ${formErrors.message ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="Tell us more about how we can help you..."
                      />
                      {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#336b6e] mb-8">{infoCardsContent.heading}</h2>
                  <p className="text-lg text-[#336b6e] opacity-80 leading-relaxed mb-8">
                    {infoCardsContent.description}
                  </p>
                </div>

                {/* Quick Contact Cards */}
                <div className="space-y-6">
                  {infoCardsContent.cards.map((card, idx) => {
                    const Icon = iconMap[card.icon] || Phone
                    return (
                      <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${card.color || 'from-[#336b6e] to-[#2a5557]'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#336b6e] mb-2">{card.title}</h3>
                            <p className="text-[#336b6e] opacity-80 mb-2">{card.subtitle}</p>
                            {card.title?.toLowerCase().includes('call us') ? (
                              <div className="flex flex-col gap-1">
                                {(card.value || '').split(',').map((num, nIdx) => (
                                  num.trim() && (
                                    <a
                                      key={nIdx}
                                      href={`tel:${num.trim().replace(/\s+/g, '')}`}
                                      className="text-[#bb9f58] font-semibold hover:underline"
                                    >
                                      {num.trim()}
                                    </a>
                                  )
                                ))}
                              </div>
                            ) : card.action ? (
                              <a href={card.action} className="text-[#bb9f58] font-semibold hover:underline">
                                {card.value}
                              </a>
                            ) : (
                              <p className="text-[#bb9f58] font-semibold">{card.value}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Response Time Info */}
                <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-[#bb9f58]" />
                    <h3 className="font-bold text-lg">{infoCardsContent.promise.title}</h3>
                  </div>
                  <ul className="space-y-2 text-sm opacity-90">
                    {infoCardsContent.promise.items.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Section */}
        <section className={`py-24 bg-white transform transition-all duration-1000 ease-out ${isSectionVisible('locations') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-6">Our Locations</h2>
              <p className="text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto">
                Visit any of our convenient locations to experience our world-class facilities and meet our expert team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className={`bg-gradient-to-br from-[#fdfcf3] to-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer ${selectedLocation === index ? 'ring-4 ring-[#bb9f58] ring-opacity-50' : ''
                    }`}
                  onClick={() => setSelectedLocation(index)}
                >
                  <div className="relative h-48">
                    <img
                      src={location.image}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <Building className="w-6 h-6 mb-2" />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#336b6e] mb-3">{location.name}</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#bb9f58] mt-1 flex-shrink-0" />
                        <p className="text-sm text-[#336b6e] opacity-80">{location.address}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#bb9f58] flex-shrink-0" />
                        <p className="text-sm text-[#336b6e] opacity-80">{location.phone}</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-[#bb9f58] mt-1 flex-shrink-0" />
                        <div className="text-sm text-[#336b6e] opacity-80">
                          <p>Mon-Fri: {location.hours.weekdays}</p>
                          <p>Sat: {location.hours.saturday}</p>
                          <p>Sun: {location.hours.sunday}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-[#336b6e] mb-2">Available Services:</h4>
                      <div className="flex flex-wrap gap-2">
                        {location.features.map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#bb9f58]/10 text-[#336b6e] text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-4 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        // window.open(`https://maps.google.com/?q=${encodeURIComponent(locations[selectedLocation]?.address)}`, '_blank')
                        // e.stopPropagation()

                        const iframeString = locations[selectedLocation]?.map_iframe

                        if (!iframeString) return


                        const match = iframeString.match(/src="([^"]+)"/)

                        if (match && match[1]) {
                          window.open(match[1], "_blank")
                        }
                      }}
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Google Maps Section */}
        <section className={`py-24 transform transition-all duration-1000 ease-out ${isSectionVisible('map') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#336b6e] mb-4">Find Us on the Map</h2>
              <p className="text-lg text-[#336b6e] opacity-80">
                Click on the location cards above to view different locations on the map
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[500px]">
              <div className="h-[500px] relative">
                {locations[selectedLocation]?.map_iframe ? (
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{
                      __html: locations[selectedLocation].map_iframe.includes('<iframe')
                        ? locations[selectedLocation].map_iframe.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"')
                        : `<iframe src="${locations[selectedLocation].map_iframe}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3] to-[#336b6e]/10 flex items-center justify-center">
                    <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
                      <MapPin className="w-12 h-12 text-[#bb9f58] mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-[#336b6e] mb-4">Location Map</h3>
                      <p className="text-[#336b6e] opacity-80 mb-6">
                        Map will be displayed here once configured in the CMS.
                      </p>
                      <div className="text-sm text-[#336b6e] opacity-60">
                        <p className="mb-2"><strong>Current Selected Location:</strong></p>
                        <p className="font-semibold text-[#bb9f58]">{locations[selectedLocation]?.name}</p>
                        <p>{locations[selectedLocation]?.address}</p>
                      </div>
                      <button
                        className="mt-4 bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(locations[selectedLocation]?.address)}`, '_blank')}
                      >
                        View on Google Maps
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Selector */}
              <div className="p-6 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white">
                <div className="flex flex-wrap justify-center gap-4">
                  {locations.map((location, index) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(index)}
                      className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${selectedLocation === index
                        ? 'bg-[#bb9f58] text-[#336b6e] scale-105'
                        : 'bg-white/20 hover:bg-white/30'
                        }`}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <Heart className="w-16 h-16 text-[#bb9f58] mx-auto mb-6" />
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  {ctaContent.heading}
                </h3>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  {ctaContent.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="bg-[#bb9f58] text-[#336b6e] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    {ctaContent.button_1}
                  </button>
                  <button
                    onClick={handleWhatsAppConnect}
                    className="border-2 border-[#bb9f58] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#bb9f58] hover:text-[#336b6e] transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {ctaContent.button_2}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={{ title: "General Inquiry (Contact Us)" }}
        />
      </div>
    </>
  )
}

export default ContactUsPage