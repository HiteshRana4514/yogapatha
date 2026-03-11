import React from 'react'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Dumbbell,
  Heart,
  Target,
  Users,
  ChevronUp,
  Loader2
} from 'lucide-react'
import supabase from '../supabase/supabse'

function FooterSection() {
  const [content, setContent] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchFooterContent()
  }, [])

  const fetchFooterContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_name', 'global')
        .filter('section_name', 'ilike', 'footer_%')

      if (error) throw error

      const contentMap = {}
      data.forEach(item => {
        contentMap[item.section_name] = item.content
      })
      setContent(contentMap)
    } catch (error) {
      console.error('Error fetching footer content:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Icons mapping for dynamic rendering
  const IconMap = {
    Facebook, Instagram, Twitter, Youtube, Dumbbell, Heart, Target, Users, MapPin, Phone, Mail, Clock
  }

  const renderIcon = (iconName, className) => {
    const Icon = IconMap[iconName]
    return Icon ? <Icon className={className} /> : null
  }

  return (
    <footer className="bg-[#336b6e] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-20 right-16 w-24 h-24 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-16 left-1/4 w-20 h-20 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-28 h-28 border-2 border-white rounded-full"></div>
      </div>

      {/* Back to Top Button */}
      <div className="relative z-10">
        <button
          onClick={scrollToTop}
          className="absolute -top-[-10px] z-[99] left-1/2 transform -translate-x-1/2 bg-[#bb9f58] text-[#336b6e] p-3 rounded-full shadow-lg hover:bg-[#a08a4a] hover:scale-110 transition-all duration-300"
          aria-label="Back to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

          {/* Logo and About Section */}
          <div className="lg:col-span-1">
            {/* Logo Container */}
            <div className="w-[138px] h-[56px] mb-6">
              <img
                className="block w-full h-full object-contain"
                src="/footerLogo.jpg"
                alt="Company Logo"
              />
            </div>

            <p className="text-white/80 leading-relaxed mb-6">
              {content?.footer_about?.description || "Transform your fitness journey with expert trainers, personalized programs, and a supportive community dedicated to helping you achieve your goals."}
            </p>

            {/* Social Media Links */}
            <div className="flex space-x-4">
              {(content?.footer_about?.social_links || [
                { platform: 'Facebook', url: '#', icon: 'Facebook' },
                { platform: 'Instagram', url: '#', icon: 'Instagram' },
                { platform: 'Twitter', url: '#', icon: 'Twitter' },
                { platform: 'YouTube', url: '#', icon: 'Youtube' }
              ]).map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  className="w-10 h-10 bg-white/10 hover:bg-[#bb9f58] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label={social.platform}
                >
                  {renderIcon(social.icon, "w-5 h-5")}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-[#bb9f58] mb-6">
              {content?.footer_links?.quick_links?.title || "Quick Links"}
            </h3>
            <ul className="space-y-3">
              {(content?.footer_links?.quick_links?.links || [
                { label: 'Home', url: '/' },
                { label: 'About Us', url: '/about_us' },
                { label: 'Services', url: '/services' },
                { label: 'Find Trainers', url: '/trainer_login' },
                { label: 'Pricing', url: '#pricing' },
                { label: 'Contact', url: '/contact_us' }
              ]).map((link, idx) => (
                <li key={idx}>
                  <a href={link.url} className="text-white/80 hover:text-[#bb9f58] transition-colors duration-300 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#bb9f58] rounded-full"></div>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold text-[#bb9f58] mb-6">
              {content?.footer_links?.services_links?.title || "Our Services"}
            </h3>
            <ul className="space-y-3">
              {(content?.footer_links?.services_links?.links || [
                { label: 'Strength Training', url: '#strength', icon: 'Dumbbell' },
                { label: 'Cardio Fitness', url: '#cardio', icon: 'Heart' },
                { label: 'Personal Coaching', url: '#personal', icon: 'Target' },
                { label: 'Group Training', url: '#group', icon: 'Users' },
                { label: 'Nutrition Guidance', url: '#nutrition' },
                { label: 'Online Training', url: '#online' }
              ]).map((link, idx) => (
                <li key={idx}>
                  <a href={link.url} className="text-white/80 hover:text-[#bb9f58] transition-colors duration-300 flex items-center gap-2">
                    {link.icon ? (
                      renderIcon(link.icon, "w-4 h-4 text-[#bb9f58]")
                    ) : (
                      <div className="w-1 h-1 bg-[#bb9f58] rounded-full ml-1.5"></div>
                    )}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold text-[#bb9f58] mb-6">
              {content?.footer_contact?.title || "Contact Info"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#bb9f58] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 whitespace-pre-line">
                    {content?.footer_contact?.address || "123 Fitness Street\nWellness District\nCity, State 12345"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#bb9f58] flex-shrink-0" />
                <a href={`tel:${content?.footer_contact?.phone || "+1234567890"}`} className="text-white/80 hover:text-[#bb9f58] transition-colors duration-300">
                  {content?.footer_contact?.phone || "+1 (234) 567-8900"}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#bb9f58] flex-shrink-0" />
                <a href={`mailto:${content?.footer_contact?.email || "info@fitnesscompany.com"}`} className="text-white/80 hover:text-[#bb9f58] transition-colors duration-300">
                  {content?.footer_contact?.email || "info@fitnesscompany.com"}
                </a>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#bb9f58] mt-0.5 flex-shrink-0" />
                <div className="text-white/80">
                  {(content?.footer_contact?.hours || [
                    "Mon - Fri: 6:00 AM - 10:00 PM",
                    "Sat - Sun: 7:00 AM - 9:00 PM"
                  ]).map((hour, idx) => (
                    <p key={idx}>{hour}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-[#bb9f58] mb-4">
              {content?.footer_newsletter?.title || "Stay Updated"}
            </h3>
            <p className="text-white/80 mb-6">
              {content?.footer_newsletter?.description || "Subscribe to our newsletter for fitness tips, exclusive offers, and updates on new training programs."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={content?.footer_newsletter?.placeholder || "Enter your email"}
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#bb9f58] focus:bg-white/20 transition-all duration-300"
              />
              <button className="bg-[#bb9f58] text-[#336b6e] px-6 py-3 rounded-full font-semibold hover:bg-[#a08a4a] transition-all duration-300 hover:scale-105">
                {content?.footer_newsletter?.button_text || "Subscribe"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/60 text-sm">
              {content?.footer_bottom?.copyright || `© ${new Date().getFullYear()} Fitness Company. All rights reserved.`}
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              {(content?.footer_bottom?.links || [
                { label: 'Privacy Policy', url: '/privacy-policy' },
                { label: 'Terms of Service', url: '/terms-and-conditions' },
                { label: 'Cookie Policy', url: '#' },
              ]).map((link, idx) => {
                // Map legacy/short URLs to correct routes
                let targetUrl = link.url
                if (targetUrl === '/privacy') targetUrl = '/privacy-policy'
                if (targetUrl === '/terms') targetUrl = '/terms-and-conditions'

                return (
                  <a key={idx} href={targetUrl} className="text-white/60 hover:text-[#bb9f58] transition-colors duration-300">
                    {link.label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterSection