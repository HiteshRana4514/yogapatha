import React, { useState, useEffect } from 'react'
import {
    Save,
    Layout,
    Info,
    Heart,
    Plus,
    Trash2,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    Loader2,
    BarChart3,
    Bookmark,
    Award,
    Type
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function AboutUsCMS() {
    const [activeSection, setActiveSection] = useState('hero')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState({})
    const [status, setStatus] = useState({ type: '', message: '' })

    const sections = [
        { id: 'hero', label: 'Hero Section', icon: Layout },
        { id: 'stats', label: 'Company Stats', icon: BarChart3 },
        { id: 'story', label: 'Our Story', icon: Bookmark },
        { id: 'values', label: 'Core Values', icon: Heart },
        { id: 'headings', label: 'Section Headings', icon: Type },
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
                .eq('page_name', 'about_us')

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

    const handleArrayChange = (section, index, field, value) => {
        const updatedArray = [...content[section]]
        updatedArray[index] = { ...updatedArray[index], [field]: value }
        setContent(prev => ({
            ...prev,
            [section]: updatedArray
        }))
    }

    const handleValueItemChange = (index, field, value) => {
        const updatedItems = [...content.values.items]
        updatedItems[index] = { ...updatedItems[index], [field]: value }
        handleInputChange('values', 'items', updatedItems)
    }

    const handleSave = async (section) => {
        setSaving(true)
        setStatus({ type: '', message: '' })
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    page_name: 'about_us',
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
                        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">About Us CMS</h1>
                        <p className="text-gray-600">Manage the content and story of your fitness family</p>
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
                                        <label className="text-sm font-semibold text-[#336b6e]">Watch Story Button Text</label>
                                        <input
                                            type="text"
                                            value={content.hero.watch_story_button_text || ''}
                                            onChange={(e) => handleInputChange('hero', 'watch_story_button_text', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
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

                            {/* Stats Editor */}
                            {activeSection === 'stats' && content.stats && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Company Stats Editor</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {content.stats.map((stat, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-8 h-8 bg-[#bb9f58] text-white rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                                    <span className="font-bold text-[#336b6e]">Stat Card</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Value (e.g., 500+)</label>
                                                    <input
                                                        type="text"
                                                        value={stat.number}
                                                        onChange={(e) => handleArrayChange('stats', idx, 'number', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] text-lg font-bold text-[#bb9f58]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Label (e.g., Happy Clients)</label>
                                                    <input
                                                        type="text"
                                                        value={stat.label}
                                                        onChange={(e) => handleArrayChange('stats', idx, 'label', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Icon Name</label>
                                                    <input
                                                        type="text"
                                                        value={stat.icon}
                                                        onChange={(e) => handleArrayChange('stats', idx, 'icon', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleSave('stats')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Stats Changes
                                    </button>
                                </div>
                            )}

                            {/* Our Story Editor */}
                            {activeSection === 'story' && content.story && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Our Story Editor</h2>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Heading</label>
                                        <input
                                            type="text"
                                            value={content.story.heading || ''}
                                            onChange={(e) => handleInputChange('story', 'heading', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Paragraph 1</label>
                                            <textarea
                                                value={content.story.paragraph_1 || ''}
                                                onChange={(e) => handleInputChange('story', 'paragraph_1', e.target.value)}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Paragraph 2</label>
                                            <textarea
                                                value={content.story.paragraph_2 || ''}
                                                onChange={(e) => handleInputChange('story', 'paragraph_2', e.target.value)}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Paragraph 3</label>
                                            <textarea
                                                value={content.story.paragraph_3 || ''}
                                                onChange={(e) => handleInputChange('story', 'paragraph_3', e.target.value)}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Badge Title</label>
                                            <input
                                                type="text"
                                                value={content.story.badge_title || ''}
                                                onChange={(e) => handleInputChange('story', 'badge_title', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Badge Subtitle</label>
                                            <input
                                                type="text"
                                                value={content.story.badge_subtitle || ''}
                                                onChange={(e) => handleInputChange('story', 'badge_subtitle', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Checklist Items (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={content.story.checklist ? content.story.checklist.join(', ') : ''}
                                            onChange={(e) => handleInputChange('story', 'checklist', e.target.value.split(',').map(s => s.trim()))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            placeholder="Item 1, Item 2, Item 3"
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleSave('story')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Story Changes
                                    </button>
                                </div>
                            )}

                            {/* Core Values Editor */}
                            {activeSection === 'values' && content.values && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Core Values Editor</h2>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Heading</label>
                                        <input
                                            type="text"
                                            value={content.values.heading || ''}
                                            onChange={(e) => handleInputChange('values', 'heading', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Section Subtitle</label>
                                        <textarea
                                            value={content.values.subtitle || ''}
                                            onChange={(e) => handleInputChange('values', 'subtitle', e.target.value)}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#336b6e]">Value Cards</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {content.values.items.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-[#fdfcf3] rounded-xl border border-[#bb9f58]/20 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 bg-[#336b6e] text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={item.title}
                                                            onChange={(e) => handleValueItemChange(idx, 'title', e.target.value)}
                                                            className="w-full font-bold text-[#336b6e] bg-transparent border-none focus:ring-0"
                                                            placeholder="Value Title"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) => handleValueItemChange(idx, 'description', e.target.value)}
                                                        rows="2"
                                                        className="w-full text-sm text-gray-600 bg-transparent border-none focus:ring-0"
                                                        placeholder="Value Description"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.icon}
                                                        onChange={(e) => handleValueItemChange(idx, 'icon', e.target.value)}
                                                        className="w-full text-xs font-mono text-gray-400 bg-transparent border-none focus:ring-0"
                                                        placeholder="Icon Name"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('values')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Values Changes
                                    </button>
                                </div>
                            )}

                            {/* Headings Editor */}
                            {activeSection === 'headings' && content.headings && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Section Headings Editor</h2>

                                    {/* Team Headings */}
                                    <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                        <h3 className="font-bold text-[#336b6e] flex items-center gap-2">
                                            <Layout className="w-4 h-4" /> Team Section
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500">Heading</label>
                                                <input
                                                    type="text"
                                                    value={content.headings.team.h}
                                                    onChange={(e) => {
                                                        const newHeadings = { ...content.headings }
                                                        newHeadings.team.h = e.target.value
                                                        handleInputChange('headings', '', newHeadings)
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500">Subtext</label>
                                                <input
                                                    type="text"
                                                    value={content.headings.team.p}
                                                    onChange={(e) => {
                                                        const newHeadings = { ...content.headings }
                                                        newHeadings.team.p = e.target.value
                                                        handleInputChange('headings', '', newHeadings)
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Testimonials Headings */}
                                    <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                        <h3 className="font-bold text-[#336b6e] flex items-center gap-2">
                                            <Award className="w-4 h-4" /> Testimonials Section
                                        </h3>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500">Heading</label>
                                            <input
                                                type="text"
                                                value={content.headings.testimonials.h}
                                                onChange={(e) => {
                                                    const newHeadings = { ...content.headings }
                                                    newHeadings.testimonials.h = e.target.value
                                                    handleInputChange('headings', '', newHeadings)
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                    </div>

                                    {/* CTA Headings */}
                                    <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                        <h3 className="font-bold text-[#336b6e] flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> CTA Section
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500">CTA Heading</label>
                                                <input
                                                    type="text"
                                                    value={content.headings.cta.h}
                                                    onChange={(e) => {
                                                        const newHeadings = { ...content.headings }
                                                        newHeadings.cta.h = e.target.value
                                                        handleInputChange('headings', '', newHeadings)
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500">Subtitle</label>
                                                <textarea
                                                    value={content.headings.cta.p}
                                                    onChange={(e) => {
                                                        const newHeadings = { ...content.headings }
                                                        newHeadings.cta.p = e.target.value
                                                        handleInputChange('headings', '', newHeadings)
                                                    }}
                                                    rows="2"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Primary Button</label>
                                                    <input
                                                        type="text"
                                                        value={content.headings.cta.button_1}
                                                        onChange={(e) => {
                                                            const newHeadings = { ...content.headings }
                                                            newHeadings.cta.button_1 = e.target.value
                                                            handleInputChange('headings', '', newHeadings)
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Secondary Button</label>
                                                    <input
                                                        type="text"
                                                        value={content.headings.cta.button_2}
                                                        onChange={(e) => {
                                                            const newHeadings = { ...content.headings }
                                                            newHeadings.cta.button_2 = e.target.value
                                                            handleInputChange('headings', '', newHeadings)
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('headings')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save All Headings
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

export default AboutUsCMS
