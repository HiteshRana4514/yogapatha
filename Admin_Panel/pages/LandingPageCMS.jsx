import React, { useState, useEffect } from 'react'
import {
    Save,
    Layout,
    Info,
    ArrowRight,
    Plus,
    Trash2,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function LandingPageCMS() {
    const [activeSection, setActiveSection] = useState('hero')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState({})
    const [status, setStatus] = useState({ type: '', message: '' })
    const [uploading, setUploading] = useState(false)

    const sections = [
        { id: 'hero', label: 'Hero Section', icon: Layout },
        { id: 'how_it_works', label: 'How It Works', icon: Info },
        { id: 'find_your_trainer', label: 'Find Trainer Headings', icon: AlertCircle },
        { id: 'faqs', label: 'FAQ Headings', icon: AlertCircle },
    ]

    useEffect(() => {
        fetchContent()
    }, [])

    const fetchContent = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('site_content')
                .select('*')
                .eq('page_name', 'landing')

            if (error) throw error

            const contentMap = {}
            data.forEach(item => {
                contentMap[item.section_name] = item.content
            })
            setContent(contentMap)
        } catch (error) {
            console.error('Error fetching CMS content:', error)
            setStatus({ type: 'error', message: 'Failed to load content' })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (section, field, value) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    const handleStepChange = (index, field, value) => {
        const updatedSteps = [...content.how_it_works.steps]
        updatedSteps[index] = { ...updatedSteps[index], [field]: value }
        handleInputChange('how_it_works', 'steps', updatedSteps)
    }

    const uploadImageToCloudinary = async (file) => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

        if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary configuration missing. Please check your .env file.')
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', uploadPreset)
        formData.append('folder', 'yogapatha/landing/hero')

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        )

        if (!response.ok) {
            throw new Error('Failed to upload image to Cloudinary')
        }

        const data = await response.json()
        return data.secure_url
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setUploading(true)
            const imageUrl = await uploadImageToCloudinary(file)

            const currentImages = content.hero.background_images || []
            const updatedImages = [...currentImages, imageUrl]

            handleInputChange('hero', 'background_images', updatedImages)
            setStatus({ type: 'success', message: 'Image uploaded successfully!' })
        } catch (error) {
            console.error('Error uploading image:', error)
            setStatus({ type: 'error', message: 'Failed to upload image' })
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (index) => {
        const updatedImages = [...content.hero.background_images]
        updatedImages.splice(index, 1)
        handleInputChange('hero', 'background_images', updatedImages)
    }

    const handleSave = async (section) => {
        setSaving(true)
        setStatus({ type: '', message: '' })
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    page_name: 'landing',
                    section_name: section,
                    content: content[section],
                    updated_at: new Date().toISOString()
                }, { onConflict: 'page_name, section_name' })

            if (error) throw error
            setStatus({ type: 'success', message: `${section.replace(/_/g, ' ')} updated successfully!` })
        } catch (error) {
            console.error('Error saving content:', error)
            setStatus({ type: 'error', message: 'Failed to save changes' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#fdfcf3]">
                <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 bg-[#fdfcf3] min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Landing Page CMS</h1>
                        <p className="text-gray-600">Manage titles, descriptions, and static content of the landing page</p>
                    </div>
                    {status.message && (
                        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-medium">{status.message}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        {sections.map((section) => {
                            const Icon = section.icon
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${activeSection === section.id
                                        ? 'bg-[#336b6e] text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-[#336b6e]/10'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {section.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Editor Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                            {/* Hero Section Editor */}
                            {activeSection === 'hero' && content.hero && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Hero Section Editor</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Main Heading Prefix</label>
                                            <input
                                                type="text"
                                                value={content.hero.heading_main || ''}
                                                onChange={(e) => handleInputChange('hero', 'heading_main', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Colored Heading Text</label>
                                            <input
                                                type="text"
                                                value={content.hero.heading_highlight || ''}
                                                onChange={(e) => handleInputChange('hero', 'heading_highlight', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Subtitle</label>
                                        <textarea
                                            value={content.hero.subtitle || ''}
                                            onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Button Text</label>
                                        <input
                                            type="text"
                                            value={content.hero.explore_button_text || ''}
                                            onChange={(e) => handleInputChange('hero', 'explore_button_text', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    {/* Background Images Slider Editor */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-[#336b6e]">Background Slides</h3>
                                            <label className="cursor-pointer bg-[#bb9f58]/10 hover:bg-[#bb9f58]/20 text-[#bb9f58] px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2">
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Add Slide Image
                                                <input
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                    className="hidden"
                                                    accept="image/*"
                                                />
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {(content.hero.background_images || []).map((img, idx) => (
                                                <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={img}
                                                        alt={`Slide ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => removeImage(idx)}
                                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                            title="Remove image"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                                        Slide {idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {(!content.hero.background_images || content.hero.background_images.length === 0) && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                                No slides added yet. Using default images.
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Editor */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#336b6e]">Hero Stats</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {content.hero.stats.map((stat, idx) => (
                                                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                                    <input
                                                        type="text"
                                                        value={stat.value}
                                                        onChange={(e) => {
                                                            const newStats = [...content.hero.stats]
                                                            newStats[idx].value = e.target.value
                                                            handleInputChange('hero', 'stats', newStats)
                                                        }}
                                                        className="w-full text-center font-bold text-[#bb9f58] bg-transparent border-none focus:ring-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={stat.label}
                                                        onChange={(e) => {
                                                            const newStats = [...content.hero.stats]
                                                            newStats[idx].label = e.target.value
                                                            handleInputChange('hero', 'stats', newStats)
                                                        }}
                                                        className="w-full text-center text-xs text-gray-500 bg-transparent border-none focus:ring-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('hero')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Hero Changes
                                    </button>
                                </div>
                            )}

                            {/* How It Works Editor */}
                            {activeSection === 'how_it_works' && content.how_it_works && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">How It Works Editor</h2>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Title</label>
                                        <input
                                            type="text"
                                            value={content.how_it_works.heading || ''}
                                            onChange={(e) => handleInputChange('how_it_works', 'heading', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Subtitle</label>
                                        <textarea
                                            value={content.how_it_works.subtitle || ''}
                                            onChange={(e) => handleInputChange('how_it_works', 'subtitle', e.target.value)}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#336b6e]">Process Steps</h3>
                                        <div className="space-y-4">
                                            {content.how_it_works.steps.map((step, idx) => (
                                                <div key={step.id} className="p-4 bg-[#fdfcf3] rounded-xl border border-[#bb9f58]/20 relative group">
                                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#bb9f58] text-white rounded-full flex items-center justify-center font-bold shadow-md">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            value={step.title}
                                                            onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                                                            className="w-full font-bold text-[#336b6e] bg-transparent border-none focus:ring-0 text-lg"
                                                            placeholder="Step Title"
                                                        />
                                                        <textarea
                                                            value={step.description}
                                                            onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                                                            rows="2"
                                                            className="w-full text-[#336b6e]/80 bg-transparent border-none focus:ring-0 text-sm"
                                                            placeholder="Step Description"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('how_it_works')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Process Changes
                                    </button>
                                </div>
                            )}

                            {/* Find Your Trainer & FAQ Headings Editor */}
                            {(activeSection === 'find_your_trainer' || activeSection === 'faqs') && content[activeSection] && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">
                                        {activeSection === 'faqs' ? 'FAQ Section' : 'Find Your Trainer Section'} Headings
                                    </h2>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Title</label>
                                        <input
                                            type="text"
                                            value={content[activeSection].heading || ''}
                                            onChange={(e) => handleInputChange(activeSection, 'heading', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Subtitle</label>
                                        <textarea
                                            value={content[activeSection].subtitle || ''}
                                            onChange={(e) => handleInputChange(activeSection, 'subtitle', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleSave(activeSection)}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Headings
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPageCMS
