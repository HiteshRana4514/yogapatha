import React, { useEffect } from 'react'
import { Shield, Award, Users, HeartHandshake, AlertCircle, CheckCircle } from 'lucide-react'

function TrainerCodeOfConduct() {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const sections = [
        {
            title: "1. Professional Integrity",
            icon: Award,
            content: "Trainers must maintain the highest standards of professional conduct. This includes honesty in reporting credentials, active certifications, and accurately representing skills to clients. Falsifying documents or qualifications is grounds for immediate account termination."
        },
        {
            title: "2. Client Safety and Well-being",
            icon: Shield,
            content: "The physical and emotional safety of clients is paramount. Trainers must prioritize evidence-based practices, recognize their professional limits, and refer clients to medical professionals when appropriate. Harassment, discrimination, or inappropriate behavior of any kind is strictly prohibited."
        },
        {
            title: "3. Respectful Communication",
            icon: Users,
            content: "Trainers must engage in clear, respectful, and timely communication with clients and YogaPatha staff. Whether communicating via the platform, WhatsApp, or in person, trainers are expected to exhibit patience, empathy, and professionalism at all times."
        },
        {
            title: "4. Commitment to Inclusivity",
            icon: HeartHandshake,
            content: "YogaPatha is dedicated to fostering an inclusive environment. Trainers must treat all clients with equal respect regardless of their race, gender, age, religion, sexual orientation, or physical ability. Adaptations and modifications should be offered to accommodate diverse needs."
        },
        {
            title: "5. Platform Guidelines",
            icon: CheckCircle,
            content: "Trainers must comply with all YogaPatha terms of service, including managing bookings through the proper channels and adhering to the platform's payment and refund policies. Circumventing the platform to process payments off-site violates our core policies."
        },
        {
            title: "6. Disciplinary Action",
            icon: AlertCircle,
            content: "Failure to adhere to this Code of Conduct may result in disciplinary action, including warnings, temporary suspension, or permanent deactivation of the trainer profile, depending on the severity of the violation."
        }
    ]

    return (
        <div className="min-h-screen bg-[#fdfcf3] pt-24 pb-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#336b6e] rounded-full mb-6">
                        <Award className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-4">Trainer Code of Conduct</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        This Code of Conduct outlines the ethical and professional standards expected of all trainers operating on the YogaPatha platform.
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
                    <p className="text-xl font-medium mb-4">Questions about these standards?</p>
                    <p className="opacity-80 mb-6">If you need clarification on any aspect of this code, please reach out to our support team.</p>
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

export default TrainerCodeOfConduct
