import React, { useState, useEffect, useRef } from 'react'
import { FileText, Phone, Users, ChevronRight, ArrowRight, Sparkles, MessageCircle } from 'lucide-react'
import { SiteContentContext } from '../pages/LandingPage'

const iconMap = {
  FileText,
  Phone,
  Users,
  Sparkles
}

function HowItWorksSection({ onGetStartedClick }) {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState([])
  const sectionRef = useRef(null)

  const siteContent = React.useContext(SiteContentContext) || {}
  const howContent = siteContent.how_it_works || {}
  const steps = howContent.steps || [
    {
      id: 1,
      title: "Fill the Form",
      description: "Complete our simple questionnaire about your fitness goals and preferences.",
      icon: "FileText", // Use string name for dynamic mapping
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: 2,
      title: "We Connect With You",
      description: "Our team reaches out to discuss your goals and create a personalized plan.",
      icon: "Phone", // Use string name for dynamic mapping
      color: "from-[#bb9f58] to-[#a08a4a]"
    },
    {
      id: 3,
      title: "Meet Your Certified Trainer",
      description: "Get matched with a qualified trainer who specializes in your goals.",
      icon: "Users", // Use string name for dynamic mapping
      color: "from-[#336b6e] to-[#2a5557]"
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Animate steps one by one
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps(prev => [...prev, index])
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleWhatsAppClick = () => {
    const phoneNumber = '919876543210' // Replace with your WhatsApp business number
    const message = encodeURIComponent(`Hi! I'm interested in starting my fitness journey with YogaPatha. Could you please provide more details?`)
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-[#fdfcf3] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#336b6e] opacity-5 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#bb9f58] opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#336b6e] opacity-3 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e] mb-6">
            {howContent.heading || "How It Works"}
          </h2>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            {howContent.subtitle || "Getting started with your fitness transformation is simple. Follow these three easy steps to connect with your perfect trainer and begin your journey."}
          </p>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 relative">
          {/* Connection Lines for Desktop */}
          <div className="hidden md:block absolute top-32 left-1/4 right-1/4 h-0.5">
            <div className="h-full bg-gradient-to-r from-transparent via-[#bb9f58] to-transparent opacity-40"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#bb9f58] rounded-full"></div>
          </div>

          {steps.map((step, index) => {
            const IconComponent = typeof step.icon === 'string' ? (iconMap[step.icon] || Sparkles) : step.icon
            const isStepVisible = visibleSteps.includes(index)

            return (
              <div key={step.id} className="relative flex flex-col">
                {/* Step Card */}
                <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform relative overflow-hidden group w-full min-h-[320px] md:min-h-[360px] flex flex-col ${isStepVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                  }`}>
                  {/* Card Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fdfcf3] to-white opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>

                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#bb9f58] text-white font-bold text-xl rounded-full flex items-center pr-2 pt-2 justify-center shadow-lg">
                    {step.id}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon Container */}
                    <div className="mb-6 relative flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-[#bb9f58]" />
                      </div>

                      {/* Icon Glow Effect */}
                      <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 bg-[#336b6e] rounded-2xl mx-auto opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300"></div>
                    </div>

                    {/* Step Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-[#336b6e] mb-4 text-center flex-shrink-0">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="text-[#336b6e] opacity-80 leading-relaxed text-center mb-6 flex-grow">
                      {step.description}
                    </p>

                    {/* Step Action Indicator */}
                    <div className="flex justify-center flex-shrink-0">
                      <div className="flex items-center gap-2 text-[#bb9f58] font-semibold">
                        <span className="text-sm">Step {step.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#336b6e] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>

                {/* Mobile Connection Arrow */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center py-4">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-8 bg-gradient-to-b from-[#bb9f58] to-transparent opacity-60"></div>
                      <div className="w-6 h-6 bg-[#bb9f58] rounded-full flex items-center justify-center shadow-md">
                        <ArrowRight className="w-3 h-3 text-white transform rotate-90" />
                      </div>
                      <div className="w-px h-8 bg-gradient-to-b from-transparent to-[#bb9f58] opacity-60"></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '800ms' }}>
          <button
            onClick={onGetStartedClick}
            className="bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {howContent.cta_button_text || "Get Started Today"}
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="bg-[#25D366] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#20BA5A] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contact us on WhatsApp
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection