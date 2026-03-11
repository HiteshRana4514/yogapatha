import React, { useState, useEffect, useRef } from 'react'
import {
  Award,
  Users,
  Target,
  Heart,
  Star,
  Trophy,
  Calendar,
  MapPin,
  CheckCircle,
  Quote,
  Play,
  ArrowRight,
  Dumbbell,
  Zap,
  Shield,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  MessageCircle
} from 'lucide-react'
import supabase from '../supabase/supabse'
import BookingModal from '../components/BookingModal'
import TestimonialSection from '../components/TestimonialSection'

function AboutUsPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleSections, setVisibleSections] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [siteContent, setSiteContent] = useState({})
  const [isLoadingCMS, setIsLoadingCMS] = useState(true)
  const sectionRef = useRef(null)

  const iconMap = {
    Calendar,
    Users,
    Award,
    MapPin,
    Target,
    Heart,
    Shield,
    Zap
  }

  const handleWhatsAppConnect = () => {
    const phoneNumber = '919876543210' // Replace with your WhatsApp business number
    const message = `Hi! I'm interested in starting my fitness journey with YogaPatha. Could you please provide more details?`
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  // Fetch CMS content
  const fetchCMSContent = async () => {
    try {
      setIsLoadingCMS(true)
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_name', 'about_us')

      if (error) throw error

      const contentMap = {}
      data.forEach(item => {
        contentMap[item.section_name] = item.content
      })
      setSiteContent(contentMap)
    } catch (err) {
      console.error('Error fetching About Us CMS content:', err)
    } finally {
      setIsLoadingCMS(false)
    }
  }

  // Company stats
  const statsContent = siteContent.stats || [
    { number: "10+", label: "Years Experience", icon: "Calendar" },
    { number: "500+", label: "Happy Clients", icon: "Users" },
    { number: "50+", label: "Expert Trainers", icon: "Award" },
    { number: "15+", label: "Locations", icon: "MapPin" }
  ]

  // Core values
  const valuesContent = siteContent.values || {
    heading: "Our Core Values",
    subtitle: "The principles that guide everything we do and shape the experience we create for our clients.",
    items: [
      {
        icon: "Target",
        title: "Goal-Oriented",
        description: "We believe every fitness journey should have clear, achievable goals that inspire and motivate you to push beyond your limits."
      },
      {
        icon: "Heart",
        title: "Passionate Care",
        description: "Our trainers genuinely care about your success and well-being, providing support that goes beyond just physical training."
      },
      {
        icon: "Shield",
        title: "Safe & Professional",
        description: "Safety is our priority. All our trainers are certified professionals who ensure proper form and injury prevention."
      },
      {
        icon: "Zap",
        title: "Innovative Methods",
        description: "We stay current with the latest fitness trends and scientifically-proven methods to deliver the most effective results."
      }
    ]
  }

  // Story Content
  const storyContent = siteContent.story || {
    heading: "Our Story",
    paragraph_1: "Founded in 2014 with a simple mission: make fitness accessible, enjoyable, and effective for everyone. What started as a small personal training studio has grown into a comprehensive fitness ecosystem that serves hundreds of clients across multiple locations.",
    paragraph_2: "Our founder, Sarah Johnson, experienced firsthand the transformative power of proper fitness guidance. After struggling with traditional gym environments, she envisioned a space where people could feel comfortable, supported, and empowered to reach their goals.",
    paragraph_3: "Today, we're proud to be a leader in personalized fitness solutions, combining cutting-edge training methods with genuine human connection to create lasting lifestyle changes.",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    badge_title: "Award Winner",
    badge_subtitle: "Best Fitness Studio 2023",
    checklist: ["Certified Professionals", "Proven Results", "Supportive Community"]
  }

  // Hero Content
  const heroContent = siteContent.hero || {
    heading_main: "About Our",
    heading_highlight: "Fitness Family",
    subtitle: "We're more than just a fitness company – we're a community dedicated to transforming lives through personalized training, expert guidance, and unwavering support on your wellness journey.",
    watch_story_button_text: "Watch Our Story"
  }

  // Headings Content
  const headingsContent = siteContent.headings || {
    team: { h: "Meet Our Team", p: "Our certified trainers and specialists are passionate about helping you achieve your fitness goals." },
    testimonials: { h: "What Our Clients Say" },
    cta: { h: "Ready to Start Your Journey?", p: "Join our fitness family and discover what you're truly capable of achieving. Your transformation starts with a single step.", button_1: "Get Started Today", button_2: "Connect with us on WhatsApp" }
  }

  // Fetch testimonials from database
  useEffect(() => {
    fetchCMSContent()
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setIsLoadingTeam(true)
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true })

      if (error) throw error

      const mappedTeam = (data || []).map(member => ({
        id: member.id,
        name: member.name,
        role: member.designation,
        image: member.image_url,
        experience: `${member.experience_years || 0} Years`,
        specialties: member.specialization ? member.specialization.split(',').map(s => s.trim()) : [],
        certifications: [], // Adding as empty array as table doesn't have it
        bio: member.bio || '',
        is_featured: member.is_featured,
        email: member.email,
        phone: member.phone,
        linkedin_url: member.linkedin_url,
        twitter_url: member.twitter_url,
        instagram_url: member.instagram_url,
        facebook_url: member.facebook_url
      }))

      setTeamMembers(mappedTeam)
    } catch (err) {
      console.error('Error fetching team members:', err)
    } finally {
      setIsLoadingTeam(false)
    }
  }


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


  // Animate sections sequentially
  useEffect(() => {
    if (isVisible) {
      const sections = ['hero', 'stats', 'story', 'values', 'team', 'testimonials', 'cta']
      sections.forEach((section, index) => {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, section])
        }, index * 200)
      })
    }
  }, [isVisible])

  const isVisibleSection = (section) => visibleSections.includes(section)

  return (
    <div ref={sectionRef} className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white">
      {/* Hero Section */}
      <section className={`py-24 md:py-32 relative overflow-hidden transform transition-all duration-1000 ease-out ${isVisibleSection('hero') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-16 w-32 h-32 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-24 h-24 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-[#336b6e] opacity-3 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#336b6e] mb-8 leading-tight">
              {heroContent.heading_main}
              <span className="block bg-gradient-to-r from-[#336b6e] to-[#bb9f58] bg-clip-text text-transparent">
                {heroContent.heading_highlight}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-[#336b6e] opacity-80 max-w-4xl mx-auto leading-relaxed mb-12">
              {heroContent.subtitle}
            </p>

            {/* Play Video Button */}
            <div className="flex justify-center">
              <button className="group bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-[#bb9f58] text-[#336b6e] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                {heroContent.watch_story_button_text}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 bg-white transform transition-all duration-1000 ease-out ${isVisibleSection('stats') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsContent.map((stat, index) => {
              const IconComponent = typeof stat.icon === 'string' ? (iconMap[stat.icon] || Award) : stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <IconComponent className="w-8 h-8 text-[#bb9f58]" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-[#336b6e] mb-2">{stat.number}</div>
                  <div className="text-[#336b6e] opacity-80 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className={`py-24 transform transition-all duration-1000 ease-out ${isVisibleSection('story') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-8">{storyContent.heading}</h2>
              <div className="space-y-6">
                <p className="text-lg text-[#336b6e] opacity-80 leading-relaxed">
                  {storyContent.paragraph_1}
                </p>
                <p className="text-lg text-[#336b6e] opacity-80 leading-relaxed">
                  {storyContent.paragraph_2}
                </p>
                <p className="text-lg text-[#336b6e] opacity-80 leading-relaxed">
                  {storyContent.paragraph_3}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {(storyContent.checklist || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#336b6e]">
                    <CheckCircle className="w-5 h-5 text-[#bb9f58]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={storyContent.image_url}
                  alt="Fitness training session"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#336b6e]/20 to-transparent"></div>
              </div>

              {/* Floating Achievement Badge */}
              <div className="absolute -bottom-6 -left-6 bg-[#bb9f58] text-[#336b6e] p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <div className="font-bold text-lg">{storyContent.badge_title}</div>
                    <div className="text-sm opacity-80">{storyContent.badge_subtitle}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`py-24 bg-white transform transition-all duration-1000 ease-out ${isVisibleSection('values') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-6">{valuesContent.heading}</h2>
            <p className="text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto">
              {valuesContent.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(valuesContent.items || []).map((value, index) => {
              const IconComponent = typeof value.icon === 'string' ? (iconMap[value.icon] || Heart) : value.icon
              return (
                <div key={index} className="text-center p-6 bg-gradient-to-br from-[#fdfcf3] to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IconComponent className="w-8 h-8 text-[#bb9f58]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#336b6e] mb-4">{value.title}</h3>
                  <p className="text-[#336b6e] opacity-80 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-24 transform transition-all duration-1000 ease-out ${isVisibleSection('team') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-6">{headingsContent.team.h}</h2>
            <p className="text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto">
              {headingsContent.team.p}
            </p>
          </div>

          {isLoadingTeam ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[#336b6e] opacity-70">Loading our team...</p>
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-gradient-to-br from-white to-[#fdfcf3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
                    {member.image ? (
                      <img
                        src={member.image}
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
                      <div className="absolute top-4 right-4 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                        <Award className="w-3 h-3" />
                        Featured
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Name & Designation */}
                    <h3 className="text-xl font-bold text-[#336b6e] mb-1 group-hover:text-[#2a5557] transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-sm text-[#bb9f58] font-semibold mb-3">
                      {member.role}
                    </p>

                    {/* Experience */}
                    <p className="text-xs text-[#336b6e] opacity-70 mb-2">
                      <span className="font-semibold">Experience:</span> {member.experience}
                    </p>

                    {/* Specialization */}
                    {member.specialties && member.specialties.length > 0 && (
                      <p className="text-xs text-[#336b6e] opacity-70 mb-3">
                        <span className="font-semibold">Specialization:</span> {member.specialties.join(', ')}
                      </p>
                    )}

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-sm text-[#336b6e] opacity-80 leading-relaxed mb-4 line-clamp-3">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
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
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-[#fdfcf3] rounded-3xl shadow-inner">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-[#336b6e] opacity-60">No team members listed at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialSection />

      {/* Call to Action */}
      <section className={`py-24 transform transition-all duration-1000 ease-out ${isVisibleSection('cta') ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <Dumbbell className="w-16 h-16 text-[#bb9f58] mx-auto mb-6" />
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                {headingsContent.cta.h}
              </h3>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                {headingsContent.cta.p}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-[#bb9f58] text-[#336b6e] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  {headingsContent.cta.button_1}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleWhatsAppConnect}
                  className="border-2 border-[#bb9f58] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#bb9f58] hover:text-[#336b6e] transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {headingsContent.cta.button_2}
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
        service={{ title: "General Inquiry (About Us)" }}
      />
    </div>
  )
}

export default AboutUsPage