import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ChevronRight, Search, Loader2 } from 'lucide-react'
import { fetchIndianStates } from '../data/locationsData'
import SEO from '../components/SEO'

function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStates()
    setIsVisible(true)
    window.scrollTo(0, 0)
  }, [])

  const loadStates = async () => {
    setLoading(true)
    const data = await fetchIndianStates()
    setStates(data)
    setLoading(false)
  }

  const siteUrl = 'https://www.yogapatha.in'
  const pageUrl = `${siteUrl}/locations`

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fdfcf3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#336b6e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfcf3]">
      <SEO 
        title="Find Yoga & Fitness Trainers Near You | YogaPatha Locations"
        description="Discover certified yoga and fitness trainers across India. Browse trainers in 12+ states and 50+ cities. Find the perfect trainer near your location."
        keywords="yoga trainers India, fitness trainers near me, yoga classes India, personal trainers by location, yoga instructors, fitness coaching India"
        ogImage="/logo.png"
        canonicalUrl={pageUrl}
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Trainers Near You
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Discover certified yoga and fitness trainers across India. Select your state to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for a state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* States Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#336b6e] mb-2">
            Select Your State
          </h2>
          <p className="text-gray-600">
            Choose from {filteredStates.length} states across India
          </p>
        </div>

        {filteredStates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No states found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStates.map((state, index) => (
              <Link
                key={state.id}
                to={`/locations/${state.slug}`}
                className={`group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* State Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={state.image}
                    alt={state.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-2xl font-bold">{state.name}</h3>
                  </div>
                </div>

                {/* State Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2 text-[#336b6e]" />
                      <span className="text-sm font-medium">
                        {state.cities.length} {state.cities.length === 1 ? 'City' : 'Cities'}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#bb9f58] group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Cities Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Popular Cities:</p>
                    <div className="flex flex-wrap gap-2">
                      {state.cities.slice(0, 3).map((city) => (
                        <span
                          key={city.id}
                          className="text-xs bg-[#fdfcf3] text-[#336b6e] px-3 py-1 rounded-full"
                        >
                          {city.name}
                        </span>
                      ))}
                      {state.cities.length > 3 && (
                        <span className="text-xs text-gray-400 px-3 py-1">
                          +{state.cities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can't Find Your Location?
          </h2>
          <p className="text-gray-200 mb-8">
            We're expanding to new cities every month. Contact us to request trainers in your area.
          </p>
          <Link
            to="/contact_us"
            className="inline-block bg-[#bb9f58] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#a68a4a] transition-colors duration-200"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LocationsPage
