import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight, ArrowLeft, Search, Building2, Loader2 } from 'lucide-react'
import { fetchIndianStates } from '../data/locationsData'
import SEO from '../components/SEO'

function StatePage() {
  const { stateSlug } = useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadState()
  }, [stateSlug])

  const loadState = async () => {
    setLoading(true)
    const states = await fetchIndianStates()
    const foundState = states.find(s => s.slug === stateSlug)

    if (!foundState) {
      navigate('/locations')
      return
    }

    setState(foundState)
    setIsVisible(true)
    setLoading(false)
    window.scrollTo(0, 0)
  }

  const siteUrl = window.location.origin
  const pageUrl = `${siteUrl}/locations/${stateSlug}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fdfcf3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#336b6e]" />
      </div>
    )
  }

  if (!state) {
    return null
  }

  const filteredCities = state.cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Generate city names for keywords
  const cityNames = state.cities.map(city => city.name).join(', ')

  return (
    <div className="min-h-screen bg-[#fdfcf3]">
      <SEO
        title={`Yoga & Fitness Trainers in ${state.name} | YogaPatha`}
        description={`Find certified yoga and fitness trainers in ${state.name}. Browse ${state.cities.length} cities including ${state.cities.slice(0, 3).map(c => c.name).join(', ')}. Book professional trainers near you.`}
        keywords={`yoga trainers ${state.name}, fitness trainers ${state.name}, yoga classes ${state.name}, personal trainers ${state.name}, ${cityNames}`}
        ogImage={state.image}
        canonicalUrl={pageUrl}
      />

      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={state.image}
          alt={state.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Back Button */}
              <Link
                to="/locations"
                className="inline-flex items-center text-white hover:text-[#bb9f58] transition-colors mb-6 group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to All States</span>
              </Link>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {state.name}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl">
                Find certified yoga and fitness trainers in {state.cities.length} cities across {state.name}
              </p>
            </div>
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
              placeholder="Search for a city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#336b6e] mb-2">
            Cities in {state.name}
          </h2>
          <p className="text-gray-600">
            Select a city to find trainers near you
          </p>
        </div>

        {filteredCities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No cities found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCities.map((city, index) => (
              <Link
                key={city.id}
                to={`/locations/${stateSlug}/${city.slug}`}
                className={`group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#336b6e] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#bb9f58] group-hover:translate-x-1 transition-transform" />
                </div>

                <h3 className="text-xl font-bold text-[#336b6e] mb-2 group-hover:text-[#bb9f58] transition-colors">
                  {city.name}
                </h3>

                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1 text-[#336b6e]" />
                  <span>{state.name}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-[#336b6e] font-medium group-hover:text-[#bb9f58] transition-colors">
                    View Trainers →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">
                {state.cities.length}+ Cities
              </h3>
              <p className="text-gray-600">
                Wide coverage across {state.name}
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 bg-[#bb9f58] rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">
                Certified Trainers
              </h3>
              <p className="text-gray-600">
                Professional and experienced
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 bg-[#336b6e] rounded-full flex items-center justify-center mx-auto mb-4">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">
                Easy Booking
              </h3>
              <p className="text-gray-600">
                Connect via WhatsApp instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatePage
