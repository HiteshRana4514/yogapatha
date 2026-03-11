import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import heroBanner_1 from '/images/heroBanner.jpg'
import heroBanner_2 from '/images/heroBanner_1.jpg'
import heroBanner_3 from '/images/heroBanner_2.jpg'
import heroBanner_4 from '/images/heroBanner_3.jpg'
import { SiteContentContext } from '../pages/LandingPage'

function HeroSection() {
  const siteContent = useContext(SiteContentContext) || {}
  const heroContent = siteContent.hero || {}
  const [isVisible, setIsVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const navigate = useNavigate()

  // Background images array
  const backgroundImages = (heroContent.background_images && heroContent.background_images.length > 0)
    ? heroContent.background_images
    : [heroBanner_1, heroBanner_2, heroBanner_3, heroBanner_4]

  useEffect(() => {
    setIsVisible(true)

    // Auto-slide functionality
    const slideInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(slideInterval)
  }, [backgroundImages.length])

  const goToPrevious = () => {
    setCurrentImageIndex(
      currentImageIndex === 0 ? backgroundImages.length - 1 : currentImageIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex(
      currentImageIndex === backgroundImages.length - 1 ? 0 : currentImageIndex + 1
    )
  }

  const goToSlide = (index) => {
    setCurrentImageIndex(index)
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image Slider with Overlay */}
      <div className="absolute inset-0">
        {/* Background Images */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            style={{ backgroundImage: `url('${image}')` }}
          ></div>
        ))}

        {/* Color Overlay to maintain theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3]/60 via-[#fdfcf3]/80 to-[#f8f6e8]/60"></div>
        {/* Additional tint overlay */}
        <div className="absolute inset-0 bg-[#336b6e]/10"></div>
      </div>

      {/* Slider Controls */}
      <div className="absolute inset-0 z-10">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/20 hover:bg-[#336b6e]/40 text-white p-2 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/20 hover:bg-[#336b6e]/40 text-white p-2 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex
                ? 'bg-[#bb9f58] scale-125'
                : 'bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-15">
        <div className="absolute top-20 left-10 animate-pulse">
          <Sparkles className="w-6 h-6 text-[#336b6e] opacity-30" />
        </div>
        <div className="absolute top-40 right-16 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
          <Star className="w-4 h-4 text-[#bb9f58] opacity-40" />
        </div>
        <div className="absolute bottom-32 left-20 animate-pulse" style={{ animationDelay: '2s' }}>
          <Zap className="w-5 h-5 text-[#336b6e] opacity-25" />
        </div>
        <div className="absolute top-32 right-1/3 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>
          <Sparkles className="w-3 h-3 text-[#bb9f58] opacity-35" />
        </div>

        {/* Floating Circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#336b6e] rounded-full opacity-5 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#bb9f58] rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Main Heading */}
        <div className={`transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#336b6e] mb-6 leading-tight">
            {heroContent.heading_main || "Transform Your"}
            <span className="block bg-gradient-to-r from-[#336b6e] to-[#bb9f58] bg-clip-text text-transparent">
              {heroContent.heading_highlight || "Fitness Journey"}
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={`transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '0.2s' }}>
          <p className="text-lg md:text-xl lg:text-2xl text-[#336b6e] opacity-80 mb-12 max-w-3xl mx-auto font-medium">
            {heroContent.subtitle || "Discover personalized training programs, expert guidance, and a community that will help you achieve your fitness goals like never before."}
          </p>
        </div>

        {/* Animated Explore Button */}
        <div className={`transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '0.4s' }}>
          <button
            onClick={() => navigate('/services')}
            className="group relative bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            {/* Button Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"></div>

            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transform scale-0 group-active:scale-100 transition-all duration-200"></div>

            <span className="relative flex items-center gap-2 cursor-pointer">
              {heroContent.explore_button_text || "Explore Now"}
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </span>

            {/* Floating particles around button */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#bb9f58] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
            <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#bb9f58] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></div>
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '0.6s' }}>
          <div className="flex flex-col items-center gap-2 text-[#336b6e] opacity-60">
            <span className="text-sm font-medium">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-[#336b6e] rounded-full flex justify-center">
              <div className="w-1 h-3 bg-[#336b6e] rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>

        {/* Stats or Features Preview */}
        <div className={`absolute bottom-40 left-0 right-0 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '0.8s' }}>
          <div className="flex justify-center items-center gap-8 md:gap-16 text-[#336b6e] opacity-70">
            {(heroContent.stats || []).length > 0 ? (
              heroContent.stats.map((stat, idx) => (
                <React.Fragment key={idx}>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#bb9f58]">{stat.value}</div>
                    <div className="text-sm md:text-base">{stat.label}</div>
                  </div>
                  {idx < heroContent.stats.length - 1 && (
                    <div className="w-px h-12 bg-[#336b6e] opacity-30"></div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#bb9f58]">500+</div>
                  <div className="text-sm md:text-base">Happy Clients</div>
                </div>
                <div className="w-px h-12 bg-[#336b6e] opacity-30"></div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#bb9f58]">50+</div>
                  <div className="text-sm md:text-base">Expert Trainers</div>
                </div>
                <div className="w-px h-12 bg-[#336b6e] opacity-30"></div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#bb9f58]">24/7</div>
                  <div className="text-sm md:text-base">Support</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection