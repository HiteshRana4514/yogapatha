import React, { useState, useEffect, useRef } from 'react'
import { Quote, Star } from 'lucide-react'
import supabase from '../supabase/supabse'

function TestimonialSection() {
    const [isVisible, setIsVisible] = useState(false)
    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const [testimonials, setTestimonials] = useState([])
    const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true)
    const sectionRef = useRef(null)

    useEffect(() => {
        fetchTestimonials()
    }, [])

    const fetchTestimonials = async () => {
        try {
            setIsLoadingTestimonials(true)
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .eq('status', 'active')
                .order('display_order', { ascending: true })

            if (error) throw error

            const mappedTestimonials = (data || []).map(item => ({
                id: item.id,
                name: item.client_name,
                role: item.client_designation,
                image: item.client_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
                rating: item.rating || 5,
                text: item.testimonial_text,
                results: item.is_featured ? "Featured Client" : ""
            }))

            setTestimonials(mappedTestimonials)
        } catch (err) {
            console.error('Error fetching testimonials:', err)
        } finally {
            setIsLoadingTestimonials(false)
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

    // Auto-rotate testimonials
    useEffect(() => {
        if (testimonials.length <= 1) return

        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [testimonials.length])

    return (
        <section ref={sectionRef} className={`py-24 bg-white transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-16">What Our Clients Say</h2>

                <div className="relative">
                    {isLoadingTestimonials ? (
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#336b6e] opacity-70">Loading testimonials...</p>
                        </div>
                    ) : testimonials.length > 0 ? (
                        <div className="bg-gradient-to-br from-[#fdfcf3] to-white rounded-3xl p-8 md:p-12 shadow-xl">
                            <Quote className="w-16 h-16 text-[#bb9f58] mx-auto mb-6 opacity-50" />

                            <div className="mb-8">
                                <p className="text-xl md:text-2xl text-[#336b6e] leading-relaxed mb-6">
                                    "{testimonials[activeTestimonial].text}"
                                </p>

                                <div className="flex justify-center mb-4">
                                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-[#bb9f58] fill-current" />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <img
                                    src={testimonials[activeTestimonial].image}
                                    alt={testimonials[activeTestimonial].name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="text-left">
                                    <div className="font-bold text-[#336b6e] text-lg">{testimonials[activeTestimonial].name}</div>
                                    <div className="text-[#336b6e] opacity-70">{testimonials[activeTestimonial].role}</div>
                                    <div className="text-[#bb9f58] font-semibold text-sm">{testimonials[activeTestimonial].results}</div>
                                </div>
                            </div>

                            {/* Testimonial Indicators */}
                            <div className="flex justify-center mt-8 space-x-3">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveTestimonial(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === activeTestimonial
                                            ? 'bg-[#bb9f58] scale-125'
                                            : 'bg-[#336b6e]/30 hover:bg-[#336b6e]/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#fdfcf3] rounded-3xl p-12 shadow-inner">
                            <p className="text-[#336b6e] opacity-60">No testimonials available yet. Be the first to share your journey!</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default TestimonialSection
