import React, { useEffect } from 'react'
import { Shield, Scale, UserCheck, AlertTriangle, FileText, ChevronRight } from 'lucide-react'

function TermsAndConditions() {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: Shield,
            content: "By accessing and using YogaPatha, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our platform. These terms apply to all visitors, trainers, and clients who use our services."
        },
        {
            title: "2. Platform Role",
            icon: Scale,
            content: "YogaPatha is a platform that connects fitness enthusiasts (Clients) with professional fitness instructors (Trainers). We facilitate communication, scheduling, and payment management but are not responsible for the direct conduct or specific outcomes of the training sessions provided by independent trainers."
        },
        {
            title: "3. Trainer Requirements (KYC)",
            icon: UserCheck,
            content: "To ensure safety and quality, all Trainers must undergo a mandatory Know Your Customer (KYC) verification process. This includes uploading a valid government-issued identity card and professional certifications. Accounts will remain in 'Pending' status until verified by our administration team. Providing false information will result in immediate termination of the account."
        },
        {
            title: "4. Client Bookings & Communication",
            icon: FileText,
            content: "Clients may book consultations and sessions through the platform. Communication is often initiated via WhatsApp for efficiency. By requesting a booking, you agree to share your contact information with the selected trainer. YogaPatha is not liable for interactions occurring outside the direct scope of the platform's session management."
        },
        {
            title: "5. Health & Liability Disclaimer",
            icon: AlertTriangle,
            content: "Physical exercise can be strenuous and subject to risk of serious injury. We strongly recommend that you consult with a physician before starting any exercise program. By using YogaPatha, you acknowledge that you voluntarily participate in these activities and assume all risks of injury, illness, or death. YogaPatha and its trainers are not responsible for any health-related complications resulting from the use of our services."
        },
        {
            title: "6. Payments & Refunds",
            icon: Scale,
            content: "Payments for services are processed through our integrated payment gateways (e.g., PhonePe). Fees are determined by the trainers or specific service packages. Refund policies are subject to individual trainer terms or specific course guidelines unless otherwise specified by YogaPatha management."
        },
        {
            title: "7. Modifications to Terms",
            icon: ChevronRight,
            content: "YogaPatha reserves the right to modify these terms at any time. We will notify users of significant changes, but it is your responsibility to review these terms periodically. Continued use of the platform constitutes acceptance of the updated terms."
        }
    ]

    return (
        <div className="min-h-screen bg-[#fdfcf3] pt-24 pb-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#336b6e] rounded-full mb-6">
                        <Scale className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-4">Terms & Conditions</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform. They outline your rights and obligations as a user of YogaPatha.
                    </p>
                    <div className="mt-4 text-sm text-gray-500 italic">
                        Last Updated: February 23, 2026
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {sections.map((section, index) => {
                        const Icon = section.icon
                        return (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-[#fdfcf3] rounded-xl">
                                        <Icon className="w-6 h-6 text-[#336b6e]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#336b6e] mb-4">{section.title}</h2>
                                        <p className="text-gray-700 leading-relaxed text-lg">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer Note */}
                <div className="mt-12 p-8 bg-[#336b6e] rounded-2xl text-center text-white">
                    <p className="text-xl font-medium mb-4">Questions about our Terms?</p>
                    <p className="opacity-80 mb-6">If you have any questions or concerns regarding these terms, please feel free to contact our support team.</p>
                    <a
                        href="/contact_us"
                        className="inline-block px-8 py-3 bg-[#bb9f58] text-[#336b6e] font-bold rounded-xl hover:bg-[#a08a4a] transition-colors"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    )
}

export default TermsAndConditions
