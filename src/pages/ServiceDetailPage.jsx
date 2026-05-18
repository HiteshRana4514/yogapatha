import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Clock, DollarSign, CheckCircle, Users, Target, Award, MessageCircle } from 'lucide-react'
import supabase from '../supabase/supabse'
import BookingModal from '../components/BookingModal'
import SEO from '../components/SEO'
import { getProductSchema } from '../utils/SchemaUtils'

function ServiceDetailPage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleWhatsAppConnect = () => {
    const phoneNumber = '918529897856'
    const message = `Hi! I'm interested in learning more about the ${service?.title} service. Could you please provide more details?`
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  useEffect(() => {
    fetchServiceDetail()
  }, [serviceId])

  useEffect(() => {
    if (!isLoading && service) {
      // Notify prerenderer that dynamic content is ready
      const timer = setTimeout(() => {
        window.prerenderReady = true;
        window.dispatchEvent(new Event('render-event'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, service]);

  const fetchServiceDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      setService(data)
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#336b6e] mb-4">Service Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={service.meta_title || `${service.title} - Professional Yoga Services`}
        description={service.meta_description || service.description?.substring(0, 160)}
        keywords={service.meta_keywords || service.category || 'yoga service, yoga training'}
        ogImage={service.image_url}
        ogType="website"
        canonicalUrl={`https://www.yogapatha.in/service/${serviceId}`}
        schemaData={getProductSchema(service)}
      />
      <div className="min-h-screen bg-[#fdfcf3]">
        {/* Hero Section */}
        <div className="relative h-96 bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
          {service.image_url && (
            <>
              <img
                src={service.image_url}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-[#336b6e] rounded-lg hover:bg-white transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Popular Badge */}
          {service.popular_tag && (
            <div className="absolute top-6 right-6 bg-[#bb9f58] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" />
              Popular
            </div>
          )}

          {/* Title & Category */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              {service.category && (
                <span className="inline-block px-3 py-1 bg-[#bb9f58] text-white text-sm font-semibold rounded-full mb-4">
                  {service.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {service.title}
              </h1>
              <div className="flex items-center gap-6 text-white">
                {service.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-current text-[#bb9f58]" />
                    <span className="text-lg font-semibold">{service.rating}</span>
                    <span className="opacity-80">/5</span>
                  </div>
                )}
                {service.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-lg font-semibold">{service.price}</span>
                  </div>
                )}
                {service.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">{service.duration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-[#336b6e] mb-4">About This Service</h2>
                <p className="text-[#336b6e] opacity-80 leading-relaxed text-lg whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-[#336b6e] mb-6">What's Included</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[#bb9f58] flex-shrink-0 mt-1" />
                        <span className="text-[#336b6e] opacity-80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-[#336b6e] mb-6">Why Choose This Service?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-[#fdfcf3] rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-[#bb9f58]" />
                    </div>
                    <h3 className="font-bold text-[#336b6e] mb-2">Personalized</h3>
                    <p className="text-sm text-[#336b6e] opacity-70">Tailored to your goals</p>
                  </div>
                  <div className="text-center p-6 bg-[#fdfcf3] rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#bb9f58]" />
                    </div>
                    <h3 className="font-bold text-[#336b6e] mb-2">Expert Trainers</h3>
                    <p className="text-sm text-[#336b6e] opacity-70">Certified professionals</p>
                  </div>
                  <div className="text-center p-6 bg-[#fdfcf3] rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-[#bb9f58]" />
                    </div>
                    <h3 className="font-bold text-[#336b6e] mb-2">Proven Results</h3>
                    <p className="text-sm text-[#336b6e] opacity-70">Track your progress</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-6">
                <h3 className="text-xl font-bold text-[#336b6e] mb-6">Ready to Start?</h3>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full px-6 py-4 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 duration-300"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={handleWhatsAppConnect}
                    className="w-full px-6 py-3 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Book on WhatsApp
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-[#336b6e] opacity-70 text-center">
                    Have questions? Our team is here to help you choose the right service for your needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={service}
        />
      </div>
    </>
  )
}

export default ServiceDetailPage
