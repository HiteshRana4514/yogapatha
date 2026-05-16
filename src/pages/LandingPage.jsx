import React, { useState, useEffect, createContext, useContext } from 'react'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import HowItWorksSection from '../components/HowItWorksSection'
import FeaturedServicesSection from '../components/FeaturedServicesSection'
import FeaturedYTTCSection from '../components/FeaturedYTTCSection'
import FindYourTrainerSection from '../components/FindYourTrainerSection'
import FAQSection from '../components/FAQSection'
import FooterSection from '../components/FooterSection'
import OurTeamSection from '../components/OurTeamSection'
import MediaSliderSection from '../components/MediaSliderSection'
import FeaturedBlogSection from '../components/FeaturedBlogSection'
import PageLoader from '../components/PageLoader'
import BookingModal from '../components/BookingModal'
import TestimonialSection from '../components/TestimonialSection'
import supabase from '../supabase/supabse'
import SEO from '../components/SEO'
import { getOrganizationSchema, getWebsiteSchema } from '../utils/SchemaUtils'

// Create a context to track loading states
export const LoadingContext = createContext()
export const SiteContentContext = createContext()

function LandingPage() {
  const [loadingStates, setLoadingStates] = useState({
    services: true,
    yttc: true,
    team: true,
    media: true,
    blogs: true,
    content: true
  })

  const [siteContent, setSiteContent] = useState({})
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    fetchSiteContent()
  }, [])

  const fetchSiteContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_name', 'landing')

      if (error) throw error

      const contentMap = {}
      data.forEach(item => {
        contentMap[item.section_name] = item.content
      })
      setSiteContent(contentMap)
    } catch (error) {
      console.error('Error fetching site content:', error)
    } finally {
      updateLoadingState('content', false)
    }
  }

  // Update loading state for a specific section
  const updateLoadingState = (section, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: isLoading
    }))
  }

  // Check if all sections have loaded
  useEffect(() => {
    const allLoaded = Object.values(loadingStates).every(state => state === false)
    if (allLoaded) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsPageLoading(false)
      }, 300)
    }
  }, [loadingStates])

  return (
    <>
      <SEO
        title="Find Certified Yoga Trainers Across India | Online & Home Yoga"
        description="Connect with professional yoga trainers in India for weight loss, stress management, prenatal yoga, and therapy. Book certified personal trainers for online or home sessions."
        keywords="certified yoga trainers in India, online yoga classes, personal yoga trainer, yoga trainers near me, home yoga sessions, yoga for weight loss, meditation yoga classes, prenatal yoga trainer, therapy yoga sessions, best yoga platform India, hire yoga instructor online"
        canonicalUrl="https://www.yogapatha.in/"
        schemaData={[getOrganizationSchema(), getWebsiteSchema()]}
      />
      {isPageLoading && <PageLoader />}

      <LoadingContext.Provider value={{ updateLoadingState }}>
        <SiteContentContext.Provider value={siteContent}>
          <HeroSection />
          <HowItWorksSection onGetStartedClick={() => setShowBookingModal(true)} />
          <FeaturedServicesSection />
          <FeaturedYTTCSection />
          <FindYourTrainerSection />
          <MediaSliderSection />
          <FeaturedBlogSection />
          <OurTeamSection />
          <TestimonialSection />
          <FAQSection />
        </SiteContentContext.Provider>
      </LoadingContext.Provider>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={{ title: "General Inquiry (Landing Page)" }}
      />
    </>
  )
}

export default LandingPage