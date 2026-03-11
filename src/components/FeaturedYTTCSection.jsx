import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Star,
    Award,
    CheckCircle,
    GraduationCap
} from 'lucide-react'
import supabase from '../supabase/supabse'
import { LoadingContext } from '../pages/LandingPage'

function FeaturedYTTCSection() {
    const navigate = useNavigate()
    const loadingContext = useContext(LoadingContext)
    const [isVisible, setIsVisible] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [courses, setCourses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [slidesToShow, setSlidesToShow] = useState(4)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const sectionRef = useRef(null)
    const autoPlayRef = useRef(null)

    // Fetch courses from database
    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })

            if (error) throw error

            setCourses(data || [])
        } catch (error) {
            console.error('Error fetching courses:', error)
        } finally {
            setIsLoading(false)
            if (loadingContext?.updateLoadingState) {
                loadingContext.updateLoadingState('yttc', false)
            }
        }
    }

    // Update slides to show based on screen size
    useEffect(() => {
        const updateSlidesToShow = () => {
            if (window.innerWidth < 640) {
                setSlidesToShow(1)
            } else if (window.innerWidth < 768) {
                setSlidesToShow(2)
            } else if (window.innerWidth < 1024) {
                setSlidesToShow(3)
            } else {
                setSlidesToShow(Math.min(4, courses.length || 4))
            }
        }

        updateSlidesToShow()
        window.addEventListener('resize', updateSlidesToShow)
        return () => window.removeEventListener('resize', updateSlidesToShow)
    }, [courses.length])

    // Interaction Observer for visibility
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

        const timer = setTimeout(() => setIsVisible(true), 2000)

        return () => {
            observer.disconnect()
            clearTimeout(timer)
        }
    }, [])

    // Auto-play functionality
    useEffect(() => {
        if (isAutoPlaying && courses.length > slidesToShow) {
            autoPlayRef.current = setInterval(() => {
                nextSlide()
            }, 5000)
        } else {
            clearInterval(autoPlayRef.current)
        }

        return () => clearInterval(autoPlayRef.current)
    }, [isAutoPlaying, currentSlide, slidesToShow, courses.length])

    const maxSlide = Math.max(0, courses.length - slidesToShow)

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1))
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1))
    }

    const handleMouseEnter = () => setIsAutoPlaying(false)
    const handleMouseLeave = () => setIsAutoPlaying(true)
    const goToSlide = (index) => setCurrentSlide(index)

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

    if (courses.length === 0) return null

    return (
        <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-[#fdfcf3] to-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-24 h-24 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
                <div className="absolute bottom-32 right-16 w-32 h-32 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className={`text-center mb-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}>
                    <div className="flex items-center justify-center gap-2 text-[#bb9f58] font-bold mb-4">
                        <GraduationCap className="w-6 h-6" />
                        <span className="uppercase tracking-[0.2em] text-sm">Professional Certifications</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e] mb-6">
                        Yoga Teacher Training
                    </h2>
                    <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-3xl mx-auto leading-relaxed">
                        Become a certified yoga instructor with our globally recognized programs.
                        Master the ancient wisdom and modern techniques of teaching.
                    </p>
                </div>

                {/* Slider Component */}
                <div
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="overflow-hidden rounded-2xl py-5">
                        <div
                            className={`flex transition-transform duration-700 ease-in-out ${courses.length < slidesToShow ? 'justify-center' : ''
                                }`}
                            style={{
                                transform: courses.length >= slidesToShow ? `translateX(-${currentSlide * (100 / courses.length)}%)` : 'none',
                                width: courses.length >= slidesToShow ? `${(courses.length / slidesToShow) * 100}%` : '100%'
                            }}
                        >
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="px-3"
                                    style={{
                                        width: courses.length >= slidesToShow
                                            ? `${100 / courses.length}%`
                                            : `${100 / slidesToShow}%`,
                                        maxWidth: courses.length < slidesToShow ? '350px' : 'none'
                                    }}
                                >
                                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative group h-full flex flex-col">
                                        {/* Course Image */}
                                        <div className="relative h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
                                            <img
                                                src={course.image_url || 'https://via.placeholder.com/600x400?text=YTTC'}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                                            {/* Level Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-[#bb9f58] text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-lg">
                                                    {course.level}
                                                </span>
                                            </div>

                                            {/* Price Badge */}
                                            {course.price && (
                                                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                                                    <span className="font-bold text-[#336b6e] text-xs">₹{course.price}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 md:p-5 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-2 text-[#336b6e] opacity-60">
                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" />
                                                    {course.duration}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <Award className="w-3 h-3" />
                                                    Certified
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-[#336b6e] mb-2 line-clamp-1 group-hover:text-[#bb9f58] transition-colors">
                                                {course.title}
                                            </h3>

                                            <p className="text-sm text-[#336b6e] opacity-80 leading-relaxed mb-4 line-clamp-2 h-10">
                                                {course.description}
                                            </p>

                                            {/* Features Teaser */}
                                            <div className="mb-4 flex-grow">
                                                <ul className="space-y-1.5">
                                                    {course.curriculum && course.curriculum.slice(0, 2).map((item, idx) => (
                                                        <li key={idx} className="flex items-start text-[11px] text-[#336b6e] opacity-70">
                                                            <CheckCircle className="w-3 h-3 text-[#bb9f58] mr-2 mt-0.5 flex-shrink-0" />
                                                            <span className="line-clamp-1">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Learn More */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0 mt-auto">
                                                <button
                                                    onClick={() => navigate(`/yttc/${course.slug}`)}
                                                    className="text-[#bb9f58] text-sm font-bold hover:text-[#a08a4a] transition-all duration-200 flex items-center gap-1 group-hover:gap-2"
                                                >
                                                    Program Details
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hover Border */}
                                        <div className="absolute inset-0 rounded-2xl border-2 border-[#336b6e] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {courses.length > slidesToShow && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                                aria-label="Previous courses"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <button
                                onClick={nextSlide}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#336b6e]/10 hover:bg-[#336b6e]/20 text-[#336b6e] p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20"
                                aria-label="Next courses"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Dot Indicators */}
                {courses.length > slidesToShow && (
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

                {/* CTA */}
                <div className={`text-center mt-16 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`} style={{ transitionDelay: '800ms' }}>
                    <button
                        onClick={() => navigate('/yttc')}
                        className="bg-[#336b6e] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#2a5557] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        View All Programs
                    </button>
                </div>
            </div>
        </section>
    )
}

export default FeaturedYTTCSection
