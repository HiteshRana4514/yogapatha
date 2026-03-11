import supabase from "../supabase/supabse"

// Fetch all states with their cities from database
export const fetchIndianStates = async () => {
  try {
    // Fetch all active states
    const { data: states, error: statesError } = await supabase
      .from('states')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (statesError) throw statesError

    // Fetch all active cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (citiesError) throw citiesError

    // Combine states with their cities
    const statesWithCities = states.map(state => ({
      ...state,
      cities: cities.filter(city => city.state_id === state.id)
    }))

    return statesWithCities
  } catch (error) {
    console.error('Error fetching states:', error)
    return []
  }
}

// Static fallback data (for development or if database is unavailable)
export const indianStates = [
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    slug: 'maharashtra',
    image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'mumbai', name: 'Mumbai', slug: 'mumbai' },
      { id: 'pune', name: 'Pune', slug: 'pune' },
      { id: 'nagpur', name: 'Nagpur', slug: 'nagpur' },
      { id: 'nashik', name: 'Nashik', slug: 'nashik' },
      { id: 'aurangabad', name: 'Aurangabad', slug: 'aurangabad' }
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi',
    slug: 'delhi',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'new-delhi', name: 'New Delhi', slug: 'new-delhi' },
      { id: 'dwarka', name: 'Dwarka', slug: 'dwarka' },
      { id: 'rohini', name: 'Rohini', slug: 'rohini' },
      { id: 'saket', name: 'Saket', slug: 'saket' }
    ]
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    slug: 'karnataka',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'bangalore', name: 'Bangalore', slug: 'bangalore' },
      { id: 'mysore', name: 'Mysore', slug: 'mysore' },
      { id: 'mangalore', name: 'Mangalore', slug: 'mangalore' },
      { id: 'hubli', name: 'Hubli', slug: 'hubli' }
    ]
  },
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    slug: 'tamil-nadu',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'chennai', name: 'Chennai', slug: 'chennai' },
      { id: 'coimbatore', name: 'Coimbatore', slug: 'coimbatore' },
      { id: 'madurai', name: 'Madurai', slug: 'madurai' },
      { id: 'salem', name: 'Salem', slug: 'salem' }
    ]
  },
  {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    slug: 'uttar-pradesh',
    image: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'lucknow', name: 'Lucknow', slug: 'lucknow' },
      { id: 'noida', name: 'Noida', slug: 'noida' },
      { id: 'ghaziabad', name: 'Ghaziabad', slug: 'ghaziabad' },
      { id: 'agra', name: 'Agra', slug: 'agra' },
      { id: 'varanasi', name: 'Varanasi', slug: 'varanasi' }
    ]
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    slug: 'gujarat',
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'ahmedabad', name: 'Ahmedabad', slug: 'ahmedabad' },
      { id: 'surat', name: 'Surat', slug: 'surat' },
      { id: 'vadodara', name: 'Vadodara', slug: 'vadodara' },
      { id: 'rajkot', name: 'Rajkot', slug: 'rajkot' }
    ]
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    slug: 'rajasthan',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'jaipur', name: 'Jaipur', slug: 'jaipur' },
      { id: 'jodhpur', name: 'Jodhpur', slug: 'jodhpur' },
      { id: 'udaipur', name: 'Udaipur', slug: 'udaipur' },
      { id: 'kota', name: 'Kota', slug: 'kota' }
    ]
  },
  {
    id: 'west-bengal',
    name: 'West Bengal',
    slug: 'west-bengal',
    image: 'https://images.unsplash.com/photo-1558431382-27e303142255?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'kolkata', name: 'Kolkata', slug: 'kolkata' },
      { id: 'howrah', name: 'Howrah', slug: 'howrah' },
      { id: 'durgapur', name: 'Durgapur', slug: 'durgapur' },
      { id: 'siliguri', name: 'Siliguri', slug: 'siliguri' }
    ]
  },
  {
    id: 'telangana',
    name: 'Telangana',
    slug: 'telangana',
    image: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'hyderabad', name: 'Hyderabad', slug: 'hyderabad' },
      { id: 'warangal', name: 'Warangal', slug: 'warangal' },
      { id: 'nizamabad', name: 'Nizamabad', slug: 'nizamabad' }
    ]
  },
  {
    id: 'punjab',
    name: 'Punjab',
    slug: 'punjab',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'chandigarh', name: 'Chandigarh', slug: 'chandigarh' },
      { id: 'ludhiana', name: 'Ludhiana', slug: 'ludhiana' },
      { id: 'amritsar', name: 'Amritsar', slug: 'amritsar' },
      { id: 'jalandhar', name: 'Jalandhar', slug: 'jalandhar' }
    ]
  },
  {
    id: 'haryana',
    name: 'Haryana',
    slug: 'haryana',
    image: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'gurugram', name: 'Gurugram', slug: 'gurugram' },
      { id: 'faridabad', name: 'Faridabad', slug: 'faridabad' },
      { id: 'panipat', name: 'Panipat', slug: 'panipat' }
    ]
  },
  {
    id: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    slug: 'madhya-pradesh',
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cities: [
      { id: 'indore', name: 'Indore', slug: 'indore' },
      { id: 'bhopal', name: 'Bhopal', slug: 'bhopal' },
      { id: 'jabalpur', name: 'Jabalpur', slug: 'jabalpur' },
      { id: 'gwalior', name: 'Gwalior', slug: 'gwalior' }
    ]
  }
]

// City details data
export const cityDetails = {
  description: "Experience world-class yoga and fitness training in {cityName}. Our certified trainers are dedicated to helping you achieve your wellness goals through personalized training programs.",
  features: [
    "Certified Professional Trainers",
    "Personalized Training Programs",
    "Flexible Scheduling Options",
    "Online & Offline Sessions",
    "Nutrition Guidance",
    "Progress Tracking"
  ],
  whatsappNumber: "+919876543210", // Default WhatsApp number
  whatsappMessage: "Hello! I'm interested in yoga/fitness training in {cityName}. Please provide more details."
}

// Helper function to get state by slug
export const getStateBySlug = async (slug) => {
  try {
    const { data: state, error } = await supabase
      .from('states')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) throw error

    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', state.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (citiesError) throw citiesError

    return { ...state, cities }
  } catch (error) {
    console.error('Error fetching state by slug:', error)
    return null
  }
}

// Helper function to get city by state and city slug
export const getCityBySlug = async (stateSlug, citySlug) => {
  try {
    const state = await getStateBySlug(stateSlug)
    if (!state) return null

    const city = state.cities.find(city => city.slug === citySlug)
    return city ? { ...city, state: state.name, stateSlug: state.slug } : null
  } catch (error) {
    console.error('Error fetching city by slug:', error)
    return null
  }
}
