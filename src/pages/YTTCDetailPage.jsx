import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, DollarSign, CheckCircle, Award, MessageCircle, Layers, Calendar, GraduationCap, Send } from 'lucide-react'
import supabase from '../supabase/supabse'
import BookingModal from '../components/BookingModal'
import SEO from '../components/SEO'

function YTTCDetailPage() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [course, setCourse] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showBookingModal, setShowBookingModal] = useState(false)

    const handleWhatsAppConnect = () => {
        const phoneNumber = '919876543210' // Replace with your WhatsApp business number
        const message = `Hi! I'm interested in the YTTC Course: ${course?.title}. Could you please share more details regarding admission and schedule?`
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
    }

    useEffect(() => {
        fetchCourseDetail()
    }, [slug])

    useEffect(() => {
        if (!isLoading && course) {
            // Notify prerenderer that dynamic content is ready
            const timer = setTimeout(() => {
                window.prerenderReady = true;
                window.dispatchEvent(new Event('render-event'));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, course]);

    const fetchCourseDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single()

            if (error) throw error
            setCourse(data)
        } catch (error) {
            console.error('Error fetching course:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
                <div className="text-center">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#336b6e] mb-4">Course Not Found</h2>
                    <button
                        onClick={() => navigate('/yttc')}
                        className="px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                    >
                        Back to YTTC Courses
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <SEO
                title={`${course.title} | YTTC Yoga Teacher Training`}
                description={course.description.substring(0, 160)}
                keywords={`yttc, ${course.title}, yoga teacher training, certified yoga instructor, yoga alliance`}
                ogImage={course.image_url}
                canonicalUrl={`https://www.yogapatha.in/yttc/${slug}`}
                ogType="product"
                schemaData={{
                    '@context': 'https://schema.org',
                    '@type': 'Course',
                    'name': course.title,
                    'description': course.description,
                    'provider': {
                        '@type': 'Organization',
                        'name': 'YogaPatha',
                        'sameAs': 'https://www.yogapatha.in/'
                    }
                }}
            />
            <div className="min-h-screen bg-[#fdfcf3]">
                {/* Hero Section */}
                <div className="relative h-[450px] bg-[#336b6e]">
                    {course.image_url && (
                        <>
                            <img
                                src={course.image_url}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        </>
                    )}

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/yttc')}
                        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-[#336b6e] rounded-lg hover:bg-white transition-colors shadow-lg z-10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Courses
                    </button>

                    {/* Course Info Badge */}
                    <div className="absolute top-6 right-6 flex gap-2 z-10">
                        <div className="bg-[#bb9f58] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            {course.level}
                        </div>
                    </div>

                    {/* Title & Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-[#336b6e] text-[#bb9f58] text-xs font-bold rounded-full uppercase tracking-wider">
                                    Yoga Alliance Certified
                                </span>
                                {course.certification && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full">
                                        {course.certification}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                {course.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-8 text-white">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-[#bb9f58]" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider opacity-60">Duration</p>
                                        <p className="text-lg font-bold">{course.duration}</p>
                                    </div>
                                </div>
                                {course.price && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-6 h-6 text-[#bb9f58]" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider opacity-60">Course Fee</p>
                                            <p className="text-lg font-bold">₹{course.price}</p>
                                        </div>
                                    </div>
                                )}
                                {course.schedule && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-6 h-6 text-[#bb9f58]" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider opacity-60">Next Batch</p>
                                            <p className="text-lg font-bold">{course.schedule}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Description */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
                                <h2 className="text-2xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                                    About the Course
                                </h2>
                                <p className="text-[#336b6e] opacity-80 leading-relaxed text-lg whitespace-pre-line">
                                    {course.description}
                                </p>
                            </div>

                            {/* Curriculum */}
                            {course.curriculum && course.curriculum.length > 0 && (
                                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
                                    <h2 className="text-2xl font-bold text-[#336b6e] mb-8 flex items-center gap-2">
                                        <Layers className="w-6 h-6 text-[#bb9f58]" />
                                        What You'll Learn (Curriculum)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {course.curriculum.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 bg-[#fdfcf3] rounded-2xl group hover:bg-[#336b6e] hover:text-white transition-all duration-300">
                                                <div className="w-8 h-8 rounded-lg bg-[#336b6e]/10 group-hover:bg-[#bb9f58]/20 flex items-center justify-center flex-shrink-0 font-bold text-[#336b6e] group-hover:text-[#bb9f58]">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-semibold">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA Section for Mobile */}
                            <div className="lg:hidden">
                                <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-3xl p-8 text-white shadow-2xl">
                                    <h3 className="text-2xl font-bold mb-4">Enroll in this Program</h3>
                                    <p className="opacity-80 mb-8">
                                        Join our Next Batch and start your transformation journey.
                                        Connect with us for enrollment details.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => setShowBookingModal(true)}
                                            className="w-full py-4 bg-[#bb9f58] text-[#336b6e] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-[#a08a4a] transition-all"
                                        >
                                            <Send className="w-6 h-6" />
                                            Enroll Now
                                        </button>
                                        <button
                                            onClick={handleWhatsAppConnect}
                                            className="w-full py-4 border-2 border-[#bb9f58] text-[#bb9f58] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#bb9f58] hover:text-[#336b6e] transition-all"
                                        >
                                            <MessageCircle className="w-6 h-6" />
                                            Contact us on WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-2xl p-8 sticky top-32 overflow-hidden border border-gray-100">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#336b6e]/5 -mr-16 -mt-16 rounded-full"></div>

                                <h3 className="text-2xl font-bold text-[#336b6e] mb-6 relative">Program Enrollment</h3>

                                <div className="space-y-6 relative">
                                    <div className="p-4 bg-[#fdfcf3] rounded-2xl space-y-4">
                                        {course.price && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-medium">Standard Price</span>
                                                <span className="text-[#336b6e] font-bold">₹{course.price}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Certification</span>
                                            <span className="text-[#336b6e] font-bold">Yoga Alliance</span>
                                        </div>
                                        {course.duration && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-medium">Total Duration</span>
                                                <span className="text-336b6e font-bold">{course.duration}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setShowBookingModal(true)}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#336b6e] text-[#bb9f58] rounded-2xl hover:bg-[#2a5557] transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                        >
                                            <Send className="w-6 h-6" />
                                            Enroll Now
                                        </button>
                                        <button
                                            onClick={handleWhatsAppConnect}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#336b6e] text-[#336b6e] rounded-2xl hover:bg-[#336b6e] hover:text-[#bb9f58] transition-all font-bold text-lg"
                                        >
                                            <MessageCircle className="w-6 h-6" />
                                            Contact us on WhatsApp
                                        </button>
                                        <p className="text-center text-[10px] text-gray-400">
                                            Enrollment is handled via direct consultation to ensure
                                            the course is the right fit for your goals.
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 space-y-4">
                                        <h4 className="font-bold text-[#336b6e] text-sm">Included in Program:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-xs text-gray-600">
                                                <CheckCircle className="w-3 h-3 text-[#bb9f58]" />
                                                Interactive Online/Offline Sessions
                                            </li>
                                            <li className="flex items-center gap-2 text-xs text-gray-600">
                                                <CheckCircle className="w-3 h-3 text-[#bb9f58]" />
                                                Comprehensive Study Material
                                            </li>
                                            <li className="flex items-center gap-2 text-xs text-gray-600">
                                                <CheckCircle className="w-3 h-3 text-[#bb9f58]" />
                                                Global Recognition
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <BookingModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    service={{ title: `Enrollment: ${course.title}`, id: course.id }}
                />
            </div>
        </>
    )
}

export default YTTCDetailPage
