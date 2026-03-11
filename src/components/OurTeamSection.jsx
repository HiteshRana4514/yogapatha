import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Award, Users, Mail, Phone, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react'
import supabase from '../supabase/supabse'
import { LoadingContext } from '../pages/LandingPage'

function OurTeamSection() {
  const [isVisible, setIsVisible] = useState(true)
  const loadingContext = useContext(LoadingContext)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const sectionRef = useRef(null)
  const autoPlayRef = useRef(null)
  const navigate = useNavigate()

  // Fetch team members from database
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true })


      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('❌ Error fetching team members:', error)
    } finally {
      setIsLoading(false)
      // Notify parent that team has loaded
      if (loadingContext?.updateLoadingState) {
        loadingContext.updateLoadingState('team', false)
      }
    }
  }

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
    if (isAutoPlaying && teamMembers.length > 0) {
      autoPlayRef.current = setInterval(() => {
        nextSlide()
      }, 4000)
    } else {
      clearInterval(autoPlayRef.current)
    }

    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying, currentSlide, slidesToShow, teamMembers.length])

  const maxSlide = Math.max(0, teamMembers.length - slidesToShow)

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

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    )
  }

  if (teamMembers.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No team members found</h3>
            <p className="text-gray-500">Please add team members from the admin panel or run the SQL script to create sample data.</p>
          </div>
        </div>
      </section>
    )
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
            <Users className="w-8 h-8 text-[#bb9f58]" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e]">
              Meet Our Team
            </h2>
          </div>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
            Our passionate team of certified yoga instructors and wellness experts are dedicated to
            helping you achieve your fitness goals and transform your life through yoga.
          </p>
        </div>

        {/* Team Members Slider */}
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
              <div className="overflow-hidden rounded-2xl py-5">
                <div
                  className="flex transition-transform duration-700 ease-in-out"   
                  style={{
                    transform: `translateX(-${currentSlide * (100 / teamMembers.length)}%)`,
                    width: `${(teamMembers.length / slidesToShow) * 100}%`
                  }}
                >
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="px-4 flex flex-col"
                      style={{ width: `${100 / teamMembers.length}%` }}
                    >
                      <div className="bg-gradient-to-br from-white to-[#fdfcf3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group flex flex-col h-full">
                        {/* Image Container */}
                        <div className="relative h-64 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-32 h-32 rounded-full bg-[#bb9f58] flex items-center justify-center text-white font-bold text-5xl">
                                {member.name.charAt(0)}
                              </div>
                            </div>
                          )}

                          {/* Featured Badge */}
                          {member.is_featured && (
                            <div className="absolute top-4 right-4 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                              <Award className="w-3 h-3" />
                              Featured
                            </div>
                          )}

                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          {/* Name & Designation */}
                          <h3 className="text-xl font-bold text-[#336b6e] mb-1 group-hover:text-[#2a5557] transition-colors duration-300">
                            {member.name}
                          </h3>
                          <p className="text-sm text-[#bb9f58] font-semibold mb-3">
                            {member.designation}
                          </p>

                          {/* Specialization */}
                          {member.specialization && (
                            <p className="text-xs text-[#336b6e] opacity-70 mb-2">
                              <span className="font-semibold">Specialization:</span> {member.specialization}
                            </p>
                          )}

                          {/* Experience */}
                          {member.experience_years > 0 && (
                            <p className="text-xs text-[#336b6e] opacity-70 mb-3">
                              <span className="font-semibold">Experience:</span> {member.experience_years} years
                            </p>
                          )}

                          {/* Bio */}
                          {member.bio && (
                            <p className="text-sm text-[#336b6e] opacity-80 leading-relaxed mb-4 line-clamp-3">
                              {member.bio}
                            </p>
                          )}

                          {/* Social Links */}
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-200 mt-auto">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="Email"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="Phone"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            {member.linkedin_url && (
                              <a
                                href={member.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="LinkedIn"
                              >
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                            {member.twitter_url && (
                              <a
                                href={member.twitter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="Twitter"
                              >
                                <Twitter className="w-4 h-4" />
                              </a>
                            )}
                            {member.instagram_url && (
                              <a
                                href={member.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="Instagram"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                            )}
                            {member.facebook_url && (
                              <a
                                href={member.facebook_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300"
                                title="Facebook"
                              >
                                <Facebook className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          {/* Bottom Border Animation */}
                          <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-[#bb9f58] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {teamMembers.length > slidesToShow && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                    aria-label="Previous team members"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                    aria-label="Next team members"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dot Indicators */}
          {teamMembers.length > slidesToShow && (
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
        </div>

        {/* Team Values */}
        <div className={`mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#bb9f58]" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Certified Experts</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                All our instructors are certified professionals with years of experience in yoga and wellness.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#bb9f58]" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Personalized Approach</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                We believe in tailored guidance that meets your unique fitness goals and lifestyle needs.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-[#bb9f58] flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#bb9f58] rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-3">Holistic Wellness</h3>
              <p className="text-[#336b6e] opacity-80 leading-relaxed">
                We focus on complete well-being - physical, mental, and spiritual transformation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OurTeamSection
