import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Award, Handshake } from 'lucide-react'

function PartnersSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sectionRef = useRef(null)
  const autoPlayRef = useRef(null)

  // Partner data - using placeholder images with different colors/styles
  const partners = [
    {
      id: 1,
      name: "FitTech Solutions",
      logo: "https://via.placeholder.com/200x100/336b6e/bb9f58?text=FitTech",
      description: "Leading fitness technology partner"
    },
    {
      id: 2,
      name: "Wellness Corp",
      logo: "https://via.placeholder.com/200x100/bb9f58/336b6e?text=Wellness",
      description: "Corporate wellness programs"
    },
    {
      id: 3,
      name: "SportGear Pro",
      logo: "https://via.placeholder.com/200x100/2a5557/bb9f58?text=SportGear",
      description: "Premium fitness equipment supplier"
    },
    {
      id: 4,
      name: "NutriLife",
      logo: "https://via.placeholder.com/200x100/a08a4a/fdfcf3?text=NutriLife",
      description: "Nutrition and supplement experts"
    },
    {
      id: 5,
      name: "HealthHub Network",
      logo: "https://via.placeholder.com/200x100/336b6e/fdfcf3?text=HealthHub",
      description: "Healthcare and wellness network"
    },
    {
      id: 6,
      name: "ActiveLife Gyms",
      logo: "https://via.placeholder.com/200x100/bb9f58/2a5557?text=ActiveLife",
      description: "Partner gym facilities nationwide"
    },
    {
      id: 7,
      name: "FlexFit Studios",
      logo: "https://via.placeholder.com/200x100/2a5557/fdfcf3?text=FlexFit",
      description: "Specialized fitness studios"
    },
    {
      id: 8,
      name: "RecoveryPro",
      logo: "https://via.placeholder.com/200x100/a08a4a/336b6e?text=RecoveryPro",
      description: "Recovery and rehabilitation services"
    }
  ]

  // Number of slides to show based on screen size
  const [slidesToShow, setSlidesToShow] = useState(4)

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

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        nextSlide()
      }, 3000)
    } else {
      clearInterval(autoPlayRef.current)
    }

    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying, currentSlide, slidesToShow])

  const maxSlide = Math.max(0, partners.length - slidesToShow)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1))
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const handleMouseEnter = () => {
    setIsAutoPlaying(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlaying(true)
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-16 w-24 h-24 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Handshake className="w-8 h-8 text-[#bb9f58]" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e]">
              Our Partners
            </h2>
          </div>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            We collaborate with industry-leading brands and organizations to provide you with
            the best fitness experience, cutting-edge equipment, and comprehensive wellness solutions.
          </p>
        </div>

        {/* Partners Slider */}
        <div
          className={`relative transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          style={{ transitionDelay: '200ms' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Slider Container */}
          <div className="relative bg-white rounded-3xl shadow-xl p-8 md:p-12 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3]/30 to-transparent pointer-events-none"></div>

            <div className="relative z-10">
              {/* Slider Viewport */}
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${currentSlide * (100 / partners.length)}%)`,
                    width: `${(partners.length / slidesToShow) * 100}%`
                  }}
                >
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="px-4"
                      style={{ width: `${100 / partners.length}%` }}
                    >
                      <div className="bg-gradient-to-br from-white to-[#fdfcf3] rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                        {/* Logo Container */}
                        <div className="mb-4 flex items-center justify-center h-24 relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                          <img
                            src={partner.logo}
                            alt={`${partner.name} logo`}
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                          />

                          {/* Overlay effect on hover */}
                          <div className="absolute inset-0 bg-[#336b6e] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                        </div>

                        {/* Partner Name */}
                        <h3 className="text-lg font-bold text-[#336b6e] text-center mb-2 group-hover:text-[#2a5557] transition-colors duration-300">
                          {partner.name}
                        </h3>

                        {/* Partner Description */}
                        <p className="text-sm text-[#336b6e] opacity-70 text-center leading-relaxed">
                          {partner.description}
                        </p>

                        {/* Bottom Border Animation */}
                        <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-[#bb9f58] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                aria-label="Previous partners"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                aria-label="Next partners"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Dot Indicators */}
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
        </div>

        {/* Partnership Benefits */}
        <div className={`mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#bb9f58]" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Premium Quality</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                Access to top-tier equipment and services through our trusted partnerships with industry leaders.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-[#bb9f58]" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Trusted Network</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                Benefit from our established relationships with certified professionals and reputable brands.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-[#bb9f58] flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#bb9f58] rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Exclusive Benefits</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                Enjoy special discounts and exclusive offers available only through our partner network.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '600ms' }}>
          <button className="bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            Become a Partner
          </button>
        </div>
      </div>
    </section>
  )
}

export default PartnersSection