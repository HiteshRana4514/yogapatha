import React, { useState, useEffect, useRef, useContext } from 'react'
import { Dumbbell, Heart, Target, Timer, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase/supabse'
import { LoadingContext } from '../pages/LandingPage'

function FeaturedServicesSection() {
  const navigate = useNavigate()
  const loadingContext = useContext(LoadingContext)
  const [isVisible, setIsVisible] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleServices, setVisibleServices] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [slidesToShow, setSlidesToShow] = useState(4)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sectionRef = useRef(null)
  const autoPlayRef = useRef(null)

  // Icon mapping for different service categories
  const iconMap = {
    'Personal': Target,
    'Group': Dumbbell,
    'Cardio': Heart,
    'Flexibility': Timer,
    'default': Dumbbell
  }

  // Fetch services from database
  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error


      // Map database services to component format
      const mappedServices = data.map(service => ({
        id: service.id,
        icon: iconMap[service.category] || iconMap.default,
        title: service.title,
        description: service.description,
        features: Array.isArray(service.features) ? service.features : [],
        rating: service.rating || 0,
        popular: service.popular_tag || false,
        image_url: service.image_url,
        price: service.price,
        duration: service.duration,
        category: service.category
      }))

      setServices(mappedServices)
    } catch (error) {
      console.error('❌ Error fetching services:', error)
    } finally {
      setIsLoading(false)
      // Notify parent that services have loaded
      if (loadingContext?.updateLoadingState) {
        loadingContext.updateLoadingState('services', false)
      }
    }
  }

  // Update slides to show based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 640) {
        setSlidesToShow(1)
      } else if (window.innerWidth < 768) {
        setSlidesToShow(2)
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(3)
      } else {
        setSlidesToShow(4)
      }
    }

    updateSlidesToShow()
    window.addEventListener('resize', updateSlidesToShow)

    return () => window.removeEventListener('resize', updateSlidesToShow)
  }, [])

  useEffect(() => {
    if (services.length > 0) {
      // Animate services one by one
      services.forEach((_, index) => {
        setTimeout(() => {
          setVisibleServices(prev => [...prev, index])
        }, index * 150)
      })
    }
  }, [services])

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && services.length > slidesToShow) {
      autoPlayRef.current = setInterval(() => {
        nextSlide()
      }, 4000)
    } else {
      clearInterval(autoPlayRef.current)
    }

    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying, currentSlide, slidesToShow, services.length])

  const maxSlide = Math.max(0, services.length - slidesToShow)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1))
  }

  const handleMouseEnter = () => {
    setIsAutoPlaying(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlaying(true)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-br from-white to-[#fdfcf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    )
  }

  if (services.length === 0) {
    return null
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-white to-[#fdfcf3] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-24 h-24 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-32 h-32 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e] mb-6">
            Featured Services
          </h2>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            Discover our most popular training programs designed to help you achieve your fitness goals
            with expert guidance and proven results.
          </p>
        </div>

        {/* Responsive Slider */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="overflow-hidden rounded-2xl py-5">
            <div
              className={`flex transition-transform duration-700 ease-in-out ${services.length < slidesToShow ? 'justify-center' : ''
                }`}
              style={{
                transform: services.length >= slidesToShow ? `translateX(-${currentSlide * (100 / services.length)}%)` : 'none',
                width: services.length >= slidesToShow ? `${(services.length / slidesToShow) * 100}%` : '100%'
              }}
            >
              {services.map((service, index) => {
                const IconComponent = service.icon

                return (
                  <div
                    key={service.id}
                    className="px-3"
                    style={{
                      width: services.length >= slidesToShow
                        ? `${100 / services.length}%`
                        : `${100 / slidesToShow}%`,
                      maxWidth: services.length < slidesToShow ? '350px' : 'none'
                    }}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative group h-full flex flex-col">
                      {/* Popular Badge */}
                      {service.popular && (
                        <div className="absolute top-3 right-3 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-20 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Popular
                        </div>
                      )}

                      {/* Service Image */}
                      <div className="relative h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconComponent className="w-16 h-16 text-[#bb9f58]" />
                          </div>
                        )}
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                        {/* Price & Duration Badge */}
                        {(service.price || service.duration) && (
                          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2 text-xs">
                              {service.price && (
                                <span className="font-bold text-[#336b6e]">{service.price}</span>
                              )}
                              {service.price && service.duration && (
                                <span className="text-gray-400">•</span>
                              )}
                              {service.duration && (
                                <span className="text-gray-600">{service.duration}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 md:p-5 flex-1 flex flex-col">
                        {/* Category Badge */}
                        {service.category && (
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 bg-[#fdfcf3] text-[#336b6e] text-xs font-semibold rounded">
                              {service.category}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="text-lg md:text-xl font-bold text-[#336b6e] mb-2">
                          {service.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-[#336b6e] opacity-80 leading-relaxed mb-3 line-clamp-3 flex-shrink-0 whitespace-pre-wrap">
                          {service.description}
                        </p>

                        {/* Features */}
                        {service.features && service.features.length > 0 && (
                          <div className="mb-4 flex-grow">
                            <ul className="space-y-1.5">
                              {service.features.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-start text-xs text-[#336b6e] opacity-70">
                                  <div className="w-1.5 h-1.5 bg-[#bb9f58] rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                                  <span className="line-clamp-1">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Rating and CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0 mt-auto">
                          {service.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-[#bb9f58] fill-current" />
                              <span className="text-sm font-semibold text-[#336b6e]">{service.rating}</span>
                              <span className="text-xs text-gray-500">/5</span>
                            </div>
                          )}
                          <button
                            onClick={() => navigate(`/services/${service.id}`)}
                            className="text-[#bb9f58] text-xs md:text-sm font-semibold hover:text-[#a08a4a] transition-colors duration-200 flex items-center gap-1"
                          >
                            Learn More
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Hover Border Effect */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-[#336b6e] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {services.length > slidesToShow && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                aria-label="Previous services"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                aria-label="Next services"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dot Indicators */}
        {services.length > slidesToShow && (
          <div className="flex justify-center mt-8 space-x-3">
            {Array.from({ length: maxSlide + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${index === currentSlide
                  ? 'w-8 h-3 bg-[#bb9f58]'
                  : 'w-3 h-3 bg-[#336b6e]/30 hover:bg-[#336b6e]/50'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '800ms' }}>
          <button
            onClick={() => navigate('/services')}
            className="bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View All Services
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedServicesSection