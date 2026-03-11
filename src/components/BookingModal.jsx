import { X, User, Mail, Phone, MessageSquare, Calendar, Send, MessageCircle } from 'lucide-react'
import supabase from '../supabase/supabse'
import { useState } from 'react'

function BookingModal({ isOpen, onClose, service }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredDate: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('booking_queries')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          preferred_date: formData.preferredDate || null,
          message: formData.message,
          service_title: service?.title || 'General Query',
          status: 'pending'
        }])
        .select()

      if (error) throw error

      alert('Booking request submitted successfully! We will contact you soon.')
      onClose()
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredDate: '',
        message: ''
      })
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Failed to submit booking: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsAppConnect = () => {
    const phoneNumber = '919876543210' // Replace with your WhatsApp business number
    const message = `Hi! I'm interested in booking the ${service?.title} service.%0A%0AName: ${formData.firstName} ${formData.lastName}%0AEmail: ${formData.email}%0APhone: ${formData.phone}%0APreferred Date: ${formData.preferredDate}%0A%0AMessage: ${formData.message || 'Please contact me for more details.'}`

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold mb-1">Book Your Session</h2>
            {service && (
              <p className="text-sm opacity-90">{service.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#336b6e] mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-[#336b6e] mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-sm font-semibold text-[#336b6e] mb-2">
              Preferred Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-[#336b6e] mb-2">
              Additional Message
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                placeholder="Any specific requirements or questions..."
              />
            </div>
          </div>

          {/* Service Info */}
          {service && (
            <div className="bg-[#fdfcf3] p-4 rounded-lg border border-[#336b6e]/20">
              <h3 className="font-semibold text-[#336b6e] mb-2">Selected Service</h3>
              <p className="text-sm text-[#336b6e] opacity-80 mb-2">{service.title}</p>
              <div className="flex items-center gap-4 text-sm">
                {service.price && (
                  <span className="font-semibold text-[#336b6e]">{service.price}</span>
                )}
                {service.duration && (
                  <span className="text-[#336b6e] opacity-70">{service.duration}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'Submitting...' : 'Submit Booking'}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppConnect}
              className="flex-1 px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Connect on WhatsApp
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            By submitting this form, you agree to be contacted by our team regarding your booking.
          </p>
        </form>
      </div>
    </div>
  )
}

export default BookingModal
