import React, { useEffect } from 'react'
import { Shield, Eye, Database, Share2, Lock, UserCheck } from 'lucide-react'
import SEO from '../components/SEO'

function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const sections = [
        {
            title: "1. Information We Collect",
            icon: Database,
            items: [
                {
                    heading: "For Clients",
                    text: "We collect your name, email address, phone number, and any information provided through booking requests or contact forms."
                },
                {
                    heading: "For Trainers",
                    text: "In addition to basic contact info, we collect professional credentials, bio, and mandatory identity documents (Government IDs) for KYC verification."
                },
                {
                    heading: "Automatic Collection",
                    text: "We may collect browser information, IP addresses, and interaction data to improve our platform experience."
                }
            ]
        },
        {
            title: "2. How We Use Your Information",
            icon: Eye,
            items: [
                {
                    heading: "Service Delivery",
                    text: "To facilitate bookings between clients and trainers and manage subscriptions/services."
                },
                {
                    heading: "Verification",
                    text: "To vet trainers and ensure a safe, professional environment for all users."
                },
                {
                    heading: "Communication",
                    text: "To send updates about your bookings, platform announcements, and support responses."
                }
            ]
        },
        {
            title: "3. Data Storage & Security",
            icon: Lock,
            items: [
                {
                    heading: "Supabase",
                    text: "Your account and profile data are securely stored using Supabase database services."
                },
                {
                    heading: "Cloudinary",
                    text: "Image assets and verification documents are managed through Cloudinary with secure access controls."
                },
                {
                    heading: "Protective Measures",
                    text: "We implement industry-standard security measures to protect your data from unauthorized access or disclosure."
                }
            ]
        },
        {
            title: "4. Third-Party Disclosures",
            icon: Share2,
            items: [
                {
                    heading: "Payment Processing",
                    text: "Financial transactions are handled by secure providers like PhonePe. We do not store your full card or bank details on our servers."
                },
                {
                    heading: "Connecting Users",
                    text: "Client contact information is shared with and only with the specific Trainer they choose to book with."
                },
                {
                    heading: "Legal Requirements",
                    text: "We may disclose information if required by law or to protect the safety and rights of YogaPatha and its users."
                }
            ]
        },
        {
            title: "5. Your Data Rights",
            icon: UserCheck,
            items: [
                {
                    heading: "Access & Update",
                    text: "You can view and update your profile information at any time through your respective dashboard."
                },
                {
                    heading: "Data Deletion",
                    text: "You may request the deletion of your account and associated personal data by contacting our support team."
                }
            ]
        }
    ]

    return (
        <>
            <SEO
                title="Privacy Policy | YogaPatha"
                description="Read YogaPatha's privacy policy to understand how we collect, use, and protect your personal information."
                keywords="privacy policy, data protection, YogaPatha privacy"
            />
            <div className="min-h-screen bg-[#fdfcf3] pt-24 pb-16 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#336b6e] rounded-full mb-6">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-4">Privacy Policy</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information at YogaPatha.
                        </p>
                        <div className="mt-4 text-sm text-gray-500 italic">
                            Last Updated: February 23, 2026
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-12">
                        {sections.map((section, index) => {
                            const Icon = section.icon
                            return (
                                <div key={index} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-[#fdfcf3] rounded-2xl">
                                            <Icon className="w-8 h-8 text-[#336b6e]" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-[#336b6e]">{section.title}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {section.items.map((item, i) => (
                                            <div key={i} className="p-6 bg-[#fdfcf3]/50 rounded-2xl border border-[#336b6e]/5">
                                                <h3 className="font-bold text-[#336b6e] mb-3">{item.heading}</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {item.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Cookie Consent Placeholder */}
                    <div className="mt-12 p-8 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#336b6e] mb-2">Cookie Usage</h3>
                            <p className="text-gray-600">We use essential cookies to ensure our platform functions correctly and to analyze web traffic.</p>
                        </div>
                        <p className="text-sm font-semibold text-[#bb9f58]">By using our site, you consent to these cookies.</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PrivacyPolicy
