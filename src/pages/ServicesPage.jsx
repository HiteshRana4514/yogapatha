import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  Heart,
  Target,
  Users,
  Apple,
  Monitor,
  Home,
  Clock,
  Filter,
  Search,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Tag
} from 'lucide-react'
import supabase from '../supabase/supabse'

function ServicesPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleServices, setVisibleServices] = useState([])
  const [categories, setCategories] = useState([{ id: 'All', name: 'All Services', icon: Filter }])
  const sectionRef = useRef(null)

  const categoryIconMap = {
    'Personal': Target,
    'Group': Users,
    'Cardio': Heart,
    'Strength': Dumbbell,
    'Nutrition': Apple,
    'Online': Monitor,
    'Home': Home,
    'Fitness': Heart,
    'Yoga': Heart,
    'Meditation': Heart
  }


  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      setError(null) // Clear any previous errors
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Map database services to component format
      const mappedServices = (data || []).map(service => ({
        id: service.id,
        title: service.title,
        category: service.category,
        image: service.image_url,
        description: service.description,
        features: Array.isArray(service.features) ? service.features : [],
        rating: service.rating || 0,
        price: service.price,
        duration: service.duration,
        popular: service.popular_tag || false
      }))

      setServices(mappedServices)

      // Derive categories from data
      const uniqueCategories = [...new Set((data || []).map(s => s.category).filter(Boolean))]
      const dynamicCategories = [
        { id: 'All', name: 'All Services', icon: Filter },
        ...uniqueCategories.map(cat => ({
          id: cat,
          name: cat,
          icon: categoryIconMap[cat] || Tag
        }))
      ]
      setCategories(dynamicCategories)
    } catch (err) {
      console.error('Error fetching services:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
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

  // Filter services based on category and search
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Animate visible services when they change
  useEffect(() => {
    setVisibleServices([])
    if (filteredServices.length > 0) {
      filteredServices.forEach((_, index) => {
        setTimeout(() => {
          setVisibleServices(prev => [...prev, index])
        }, index * 100)
      })
    }
  }, [filteredServices.length, selectedCategory, searchTerm])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#336b6e] mb-6">
            Our Services
          </h1>
          <p className="text-xl md:text-2xl text-[#336b6e] opacity-80 max-w-4xl mx-auto leading-relaxed">
            Comprehensive fitness solutions designed to help you achieve your goals.
            From personal training to group classes, we have everything you need for your fitness journey.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className={`mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '200ms' }}>
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-[#336b6e]"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon
              const isActive = selectedCategory === category.id

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${isActive
                    ? 'bg-[#336b6e] text-[#bb9f58] shadow-lg'
                    : 'bg-white text-[#336b6e] hover:bg-[#fdfcf3] shadow-md hover:shadow-lg'
                    }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">{category.id}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Content: Loading, Error, or Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#336b6e] font-medium">Loading services...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#336b6e] mb-2">Error Loading Services</h3>
            <p className="text-red-600 max-w-md mx-auto mb-8">{error}</p>
            <button
              onClick={fetchServices}
              className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service, index) => {
                const isServiceVisible = visibleServices.includes(index)

                return (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/services/${service.id}`)}
                    className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform overflow-hidden group cursor-pointer ${isServiceVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                      }`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    {/* Service Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Popular Badge */}
                      {service.popular && (
                        <div className="absolute top-4 left-4 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          Popular
                        </div>
                      )}

                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-[#336b6e] text-[#bb9f58] px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {service.price}
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      {/* Rating and Duration */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#bb9f58] fill-current" />
                          <span className="text-sm font-semibold text-[#336b6e]">{service.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#336b6e] opacity-70">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{service.duration}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-[#336b6e] mb-3 group-hover:text-[#2a5557] transition-colors duration-300">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[#336b6e] opacity-80 leading-relaxed mb-4 text-sm whitespace-pre-wrap line-clamp-3">
                        {service.description}
                      </p>

                      {/* Features */}
                      <div className="mb-6">
                        <ul className="grid grid-cols-2 gap-2">
                          {service.features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-center text-xs text-[#336b6e] opacity-70">
                              <CheckCircle className="w-3 h-3 text-[#bb9f58] mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Learn More Button */}
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group-hover:shadow-lg"
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* No Results Message */}
            {filteredServices.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-[#336b6e] opacity-50" />
                </div>
                <h3 className="text-2xl font-bold text-[#336b6e] mb-4">No Services Found</h3>
                <p className="text-[#336b6e] opacity-80 mb-6">
                  Try adjusting your search terms or selecting a different category.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('All')
                  }}
                  className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '800ms' }}>
          <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                Choose the perfect service for your fitness journey and let our expert trainers
                help you achieve your goals faster than ever before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-[#bb9f58] text-[#336b6e] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg">
                  Book Consultation
                </button>
                <button className="border-2 border-[#bb9f58] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#bb9f58] hover:text-[#336b6e] transform hover:scale-105 transition-all duration-300">
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div >
    </section >
  )
}

export default ServicesPage