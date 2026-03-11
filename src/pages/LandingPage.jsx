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