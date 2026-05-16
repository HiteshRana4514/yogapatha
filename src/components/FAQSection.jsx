import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Search, MessageCircle, HelpCircle, ArrowRight, Sparkles, Plus, Minus } from 'lucide-react'
import { SiteContentContext } from '../pages/LandingPage'
import BookingModal from './BookingModal'
import supabase from '../supabase/supabse'

function FAQSection() {
  const siteContent = React.useContext(SiteContentContext) || {}
  const faqContent = siteContent.faqs || {}
  const [activeIndex, setActiveIndex] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [visibleItems, setVisibleItems] = useState([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [faqs, setFaqs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const sectionRef = useRef(null)

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true })

      if (error || !data || data.length === 0) {
        console.warn('Faqs table empty or error, using fallback data')
        setFaqs(faqContent.items || defaultFaqs)
      } else {
        setFaqs(data)
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err)
      setFaqs(faqContent.items || defaultFaqs)
    } finally {
      setIsLoading(false)
    }
  }

  const defaultFaqs = [
    {
      id: 1,
      question: "How do I get started with finding a trainer?",
      answer: "Getting started is simple! Fill out our 'Find Your Trainer' form with your personal details and fitness goals. We'll analyze your requirements and match you with certified trainers in your area. Our team will then contact you within 24 hours to discuss your needs and schedule a consultation with your matched trainer."
    },
    {
      id: 2,
      question: "What qualifications do your trainers have?",
      answer: "All our trainers are certified professionals with recognized fitness certifications from organizations like NASM, ACE, ACSM, or equivalent. They undergo continuous education and training to stay updated with the latest fitness techniques. Each trainer has a minimum of 2 years of practical experience and specializes in different areas like strength training, weight loss, sports conditioning, or rehabilitation."
    },
    {
      id: 3,
      question: "How much do personal training sessions cost?",
      answer: "Our pricing varies based on the trainer's experience, session duration, and package type. Individual sessions typically range from $50-$100 per hour. We offer discounted packages for multiple sessions - 4-session packages save 10%, 8-session packages save 15%, and 12-session packages save 20%. Group sessions and online training options are also available at reduced rates."
    },
    {
      id: 4,
      question: "Can I train online or do I need to meet in person?",
      answer: "We offer both options to suit your preferences and lifestyle! In-person training is available at our partner gyms, your home, or outdoor locations. Online training sessions are conducted via video calls with real-time guidance and form correction. Hybrid packages combining both formats are also popular among our clients."
    },
    {
      id: 5,
      question: "What if I'm not satisfied with my trainer?",
      answer: "Your satisfaction is our priority. If you're not completely happy with your trainer after the first session, we'll match you with a different trainer at no extra cost. We offer a 30-day satisfaction guarantee - if you're not seeing progress or enjoying your sessions, we'll work with you to find a better fit or provide a partial refund."
    },
    {
      id: 6,
      question: "Do you offer nutrition guidance along with training?",
      answer: "Yes! Many of our trainers are also certified nutrition coaches who can provide meal planning, dietary guidance, and nutrition education. We offer comprehensive wellness packages that include both fitness training and nutrition counseling. Standalone nutrition consultations are also available if you prefer to focus solely on your diet."
    },
    {
      id: 7,
      question: "How often should I train with a personal trainer?",
      answer: "The frequency depends on your goals, fitness level, and budget. Beginners typically benefit from 2-3 sessions per week initially, then can reduce to 1-2 sessions as they build confidence. For specific goals like competition prep or injury recovery, more frequent sessions may be recommended. We'll help you create a sustainable schedule during your consultation."
    },
    {
      id: 8,
      question: "What should I expect in my first training session?",
      answer: "Your first session includes a comprehensive fitness assessment covering your health history, current fitness level, and specific goals. Your trainer will conduct basic movement screenings, discuss any injuries or limitations, and create a personalized workout plan. The session will also include a trial workout to demonstrate exercises and ensure proper form."
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            // Animate FAQ items one by one
            faqs.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => [...prev, index])
              }, index * 100)
            })
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [faqs])

  const toggleItem = (index) => {
    setActiveIndex(prevIndex => prevIndex === index ? null : index)
  }

  const handleWhatsAppConnect = () => {
    const phoneNumber = '918529897856' // Replace with actual business number
    const message = encodeURIComponent("Hi YogaPatha team! I have some questions regarding your programs. Can you help me?")
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-white to-[#fdfcf3] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-12 w-28 h-28 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-24 left-12 w-36 h-36 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-[#bb9f58] opacity-4 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-8 h-8 text-[#bb9f58]" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e]">
              {faqContent.heading || "Frequently Asked Questions"}
            </h2>
          </div>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            {faqContent.subtitle || "Find answers to common questions about our personal training services, pricing, and what to expect on your fitness journey."}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : faqs.map((faq, index) => {
            const isOpen = activeIndex === index
            const isItemVisible = visibleItems.includes(index)

            return (
              <div
                key={faq.id || index}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform overflow-hidden ${isItemVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 md:px-8 py-6 text-left flex items-center justify-between gap-4 hover:bg-[#fdfcf3]/50 transition-all duration-300 group"
                >
                  <h3 className="text-lg md:text-xl font-semibold text-[#336b6e] group-hover:text-[#2a5557] transition-colors duration-300 pr-4">
                    {faq.question}
                  </h3>

                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full bg-[#bb9f58] flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 ${isOpen ? 'rotate-180 bg-[#336b6e]' : ''
                      }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Answer Content */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="px-6 md:px-8 pb-6">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[#336b6e] opacity-80 leading-relaxed pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Border Animation */}
                <div className={`h-1 bg-gradient-to-r from-[#336b6e] to-[#bb9f58] transition-all duration-300 transform origin-left ${isOpen ? 'scale-x-100' : 'scale-x-0'
                  }`}></div>
              </div>
            )
          })}
        </div>

        {/* Contact Section */}
        <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '1000ms' }}>
          <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <HelpCircle className="w-12 h-12 text-[#bb9f58] mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Still Have Questions?
              </h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Our team is here to help! Get in touch with us for personalized assistance
                and detailed information about our training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-[#bb9f58] text-[#336b6e] px-8 py-3 rounded-full font-semibold hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Support
                </button>
                <button
                  onClick={handleWhatsAppConnect}
                  className="border-2 border-[#bb9f58] text-[#bb9f58] px-8 py-3 rounded-full font-semibold hover:bg-[#bb9f58] hover:text-[#336b6e] transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact us on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={{ title: "General FAQ Inquiry" }}
      />
    </section>
  )
}

export default FAQSection