import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap,
    Clock,
    Search,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Award,
    Layers,
    Calendar
} from 'lucide-react'
import supabase from '../supabase/supabse'
import BookingModal from '../components/BookingModal'
import SEO from '../components/SEO'

function YTTCPage() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const [courses, setCourses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [visibleCourses, setVisibleCourses] = useState([])
    const [showBookingModal, setShowBookingModal] = useState(false)
    const sectionRef = useRef(null)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })

            if (error) throw error
            setCourses(data || [])
        } catch (err) {
            console.error('Error fetching courses:', err)
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

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    useEffect(() => {
        setVisibleCourses([])
        if (filteredCourses.length > 0) {
            filteredCourses.forEach((_, index) => {
                setTimeout(() => {
                    setVisibleCourses(prev => [...prev, index])
                }, index * 100)
            })
        }
    }, [filteredCourses.length, searchTerm])

    const handleWhatsAppConnect = () => {
        const phoneNumber = '918529897856' // Replace with actual business number
        const message = encodeURIComponent("Hi YogaPatha team! I'm interested in your Yoga Teacher Training Courses. Can you help me?")
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    }

    return (
        <>
            <SEO
                title="Yoga Teacher Training Course (YTTC) | Certified Yoga Instructor Training"
                description="Become a certified yoga instructor with our Yoga Alliance accredited YTTC programs. Deepen your practice and learn professional teaching techniques."
                keywords="yoga teacher training, yttc, yoga alliance, yoga certification, become yoga teacher"
                canonicalUrl="https://www.yogapatha.in/yttc"
            />
            <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`text-center mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#336b6e] mb-6">
                            Yoga Teacher Training
                        </h1>
                        <p className="text-xl md:text-2xl text-[#336b6e] opacity-80 max-w-4xl mx-auto leading-relaxed">
                            Begin your journey towards becoming a certified yoga instructor.
                            Our Yoga Alliance certified courses offer a deep dive into the practice,
                            philosophy, and teaching of yoga.
                        </p>
                    </div>

                    <div className={`mb-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`} style={{ transitionDelay: '200ms' }}>
                        <div className="max-w-md mx-auto mb-8">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 text-[#336b6e]"
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#336b6e] font-medium">Loading courses...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#336b6e] mb-2">Error Loading Courses</h3>
                            <p className="text-red-600 max-w-md mx-auto mb-8">{error}</p>
                            <button
                                onClick={fetchCourses}
                                className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 shadow-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCourses.map((course, index) => {
                                    const isCourseVisible = visibleCourses.includes(index)

                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => navigate(`/yttc/${course.slug}`)}
                                            className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform overflow-hidden group cursor-pointer ${isCourseVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                                                }`}
                                            style={{ transitionDelay: `${400 + index * 100}ms` }}
                                        >
                                            <div className="relative h-56 overflow-hidden">
                                                <img
                                                    src={course.image_url || 'https://via.placeholder.com/600x400?text=YTTC+Course'}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-[#bb9f58] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                        {course.level}
                                                    </span>
                                                </div>
                                                {course.price && (
                                                    <div className="absolute top-4 right-4 bg-[#336b6e] text-[#bb9f58] px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                                        ₹{course.price}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4 text-[#336b6e] opacity-70">
                                                    <div className="flex items-center gap-1 text-sm font-semibold">
                                                        <Clock className="w-4 h-4" />
                                                        {course.duration}
                                                    </div>
                                                    {course.certification && (
                                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                                            <Award className="w-4 h-4" />
                                                            Certified
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="text-2xl font-bold text-[#336b6e] mb-3 group-hover:text-[#2a5557] transition-colors duration-300 line-clamp-1">
                                                    {course.title}
                                                </h3>

                                                <p className="text-[#336b6e] opacity-80 leading-relaxed mb-6 text-sm line-clamp-3 h-15">
                                                    {course.description}
                                                </p>

                                                <div className="space-y-3 mb-6">
                                                    {course.curriculum && course.curriculum.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="flex items-center text-xs text-[#336b6e] opacity-70">
                                                            <CheckCircle className="w-3 h-3 text-[#bb9f58] mr-2 flex-shrink-0" />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/yttc/${course.slug}`)}
                                                    className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group-hover:shadow-lg"
                                                >
                                                    Enroll Now
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {filteredCourses.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <GraduationCap className="w-12 h-12 text-[#336b6e] opacity-50" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#336b6e] mb-4">No YTTC Courses Found</h3>
                                    <p className="text-[#336b6e] opacity-80 mb-6">
                                        Try adjusting your search terms or check back later.
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`} style={{ transitionDelay: '800ms' }}>
                        <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-10 right-10 w-32 h-32 border-8 border-white rounded-full"></div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                    Not sure where to start?
                                </h3>
                                <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                                    Connect with our expert consultants for a free counseling session on
                                    our teacher training programs.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="bg-[#bb9f58] text-[#336b6e] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#a08a4a] transform hover:scale-105 transition-all duration-300 shadow-lg"
                                    >
                                        Free Counseling
                                    </button>
                                    <button
                                        onClick={handleWhatsAppConnect}
                                        className="border-2 border-[#bb9f58] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#bb9f58] hover:text-[#336b6e] transform hover:scale-105 transition-all duration-300"
                                    >
                                        Connect on WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <BookingModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    service={{ title: "Free YTTC Counseling" }}
                />
            </section>
        </>
    )
}

export default YTTCPage
