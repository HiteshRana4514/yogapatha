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
    Loader2,
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Link as LinkIcon,
    Phone,
    Mail,
    MapPin,
    Clock,
    Globe
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function FooterCMS() {
    const [activeSection, setActiveSection] = useState('footer_about')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState({})
    const [status, setStatus] = useState({ type: '', message: '' })

    const sections = [
        { id: 'footer_about', label: 'About & Social', icon: Info },
        { id: 'footer_links', label: 'Links (Quick & Services)', icon: LinkIcon },
        { id: 'footer_contact', label: 'Contact Info', icon: Phone },
        { id: 'footer_newsletter', label: 'Newsletter', icon: Mail },
        { id: 'footer_bottom', label: 'Bottom Bar', icon: Layout },
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
                .eq('page_name', 'global')
                .filter('section_name', 'ilike', 'footer_%')

            if (error) throw error

            const contentMap = {}
            data.forEach(item => {
                contentMap[item.section_name] = item.content
            })

            // Set default values if content is missing
            const defaults = {
                footer_about: { description: '', social_links: [] },
                footer_links: {
                    quick_links: { title: 'Quick Links', links: [] },
                    services_links: { title: 'Our Services', links: [] }
                },
                footer_contact: { title: 'Contact Info', address: '', phone: '', email: '', hours: [] },
                footer_newsletter: { title: 'Stay Updated', description: '', button_text: 'Subscribe', placeholder: '' },
                footer_bottom: { copyright: '', links: [] }
            }

            setContent({ ...defaults, ...contentMap })
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

    const handleNestedChange = (section, parentField, field, value) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [parentField]: {
                    ...prev[section][parentField],
                    [field]: value
                }
            }
        }))
    }

    const handleSave = async (section) => {
        setSaving(true)
        setStatus({ type: '', message: '' })
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    page_name: 'global',
                    section_name: section,
                    content: content[section],
                    updated_at: new Date().toISOString()
                }, { onConflict: 'page_name, section_name' })

            if (error) throw error
            setStatus({ type: 'success', message: `${section.replace(/footer_/g, '').replace(/_/g, ' ')} updated successfully!` })
        } catch (error) {
            console.error('Error saving content:', error)
            setStatus({ type: 'error', message: 'Failed to save changes' })
        } finally {
            setSaving(false)
        }
    }

    // List Management Helpers
    const addListItem = (section, field, defaultValue) => {
        const newList = [...(content[section][field] || []), defaultValue]
        handleInputChange(section, field, newList)
    }

    const removeListItem = (section, field, index) => {
        const newList = [...content[section][field]]
        newList.splice(index, 1)
        handleInputChange(section, field, newList)
    }

    const updateListItem = (section, field, index, subField, value) => {
        const newList = [...content[section][field]]
        newList[index] = { ...newList[index], [subField]: value }
        handleInputChange(section, field, newList)
    }

    const addNestedListItem = (section, parentField, field, defaultValue) => {
        const newList = [...(content[section][parentField][field] || []), defaultValue]
        handleNestedChange(section, parentField, field, newList)
    }

    const removeNestedListItem = (section, parentField, field, index) => {
        const newList = [...content[section][parentField][field]]
        newList.splice(index, 1)
        handleNestedChange(section, parentField, field, newList)
    }

    const updateNestedListItem = (section, parentField, field, index, subField, value) => {
        const newList = [...content[section][parentField][field]]
        newList[index] = { ...newList[index], [subField]: value }
        handleNestedChange(section, parentField, field, newList)
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
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Footer CMS</h1>
                        <p className="text-gray-600">Manage global footer content across all pages</p>
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

                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">

                            {/* About & Social */}
                            {activeSection === 'footer_about' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">About & Social Media</h2>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">About Text</label>
                                        <textarea
                                            value={content.footer_about.description}
                                            onChange={(e) => handleInputChange('footer_about', 'description', e.target.value)}
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            placeholder="Footer about description..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-[#336b6e]">Social Links</h3>
                                            <button
                                                onClick={() => addListItem('footer_about', 'social_links', { platform: '', url: '', icon: 'Globe' })}
                                                className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                            >
                                                <Plus className="w-4 h-4" /> Add Social Link
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {content.footer_about.social_links.map((link, idx) => (
                                                <div key={idx} className="flex gap-3 p-4 bg-gray-50 rounded-xl relative group">
                                                    <div className="flex-1 space-y-3">
                                                        <select
                                                            value={link.platform}
                                                            onChange={(e) => updateListItem('footer_about', 'social_links', idx, 'platform', e.target.value)}
                                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                                        >
                                                            <option value="">Select Platform</option>
                                                            <option value="Facebook">Facebook</option>
                                                            <option value="Instagram">Instagram</option>
                                                            <option value="Twitter">Twitter</option>
                                                            <option value="Youtube">Youtube</option>
                                                            <option value="LinkedIn">LinkedIn</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={link.url}
                                                            onChange={(e) => updateListItem('footer_about', 'social_links', idx, 'url', e.target.value)}
                                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                                            placeholder="URL (e.g., https://...)"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeListItem('footer_about', 'social_links', idx)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('footer_about')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {/* Links Manager */}
                            {activeSection === 'footer_links' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Quick Links & Services</h2>

                                    {/* Quick Links Sub-section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                value={content.footer_links.quick_links.title}
                                                onChange={(e) => handleNestedChange('footer_links', 'quick_links', 'title', e.target.value)}
                                                className="text-xl font-bold text-[#336b6e] bg-transparent border-b border-gray-200 focus:border-[#bb9f58] focus:outline-none"
                                            />
                                            <button
                                                onClick={() => addNestedListItem('footer_links', 'quick_links', 'links', { label: '', url: '' })}
                                                className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                            >
                                                <Plus className="w-4 h-4" /> Add Link
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {content.footer_links.quick_links.links.map((link, idx) => (
                                                <div key={idx} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => updateNestedListItem('footer_links', 'quick_links', 'links', idx, 'label', e.target.value)}
                                                        className="flex-1 min-w-0 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                        placeholder="Label"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={(e) => updateNestedListItem('footer_links', 'quick_links', 'links', idx, 'url', e.target.value)}
                                                        className="flex-[1.5] min-w-0 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                        placeholder="URL"
                                                    />
                                                    <button onClick={() => removeNestedListItem('footer_links', 'quick_links', 'links', idx)} className="text-red-400 p-1">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Services Links Sub-section */}
                                    <div className="space-y-4 border-t pt-8">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                value={content.footer_links.services_links.title}
                                                onChange={(e) => handleNestedChange('footer_links', 'services_links', 'title', e.target.value)}
                                                className="text-xl font-bold text-[#336b6e] bg-transparent border-b border-gray-200 focus:border-[#bb9f58] focus:outline-none"
                                            />
                                            <button
                                                onClick={() => addNestedListItem('footer_links', 'services_links', 'links', { label: '', url: '', icon: '' })}
                                                className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                            >
                                                <Plus className="w-4 h-4" /> Add Service Link
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {content.footer_links.services_links.links.map((link, idx) => (
                                                <div key={idx} className="space-y-2 p-3 bg-gray-50 rounded-lg relative">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            onChange={(e) => updateNestedListItem('footer_links', 'services_links', 'links', idx, 'label', e.target.value)}
                                                            className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                            placeholder="Label"
                                                        />
                                                        <button onClick={() => removeNestedListItem('footer_links', 'services_links', 'links', idx)} className="text-red-400">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={(e) => updateNestedListItem('footer_links', 'services_links', 'links', idx, 'url', e.target.value)}
                                                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                        placeholder="URL"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('footer_links')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save All Links
                                    </button>
                                </div>
                            )}

                            {/* Contact Info */}
                            {activeSection === 'footer_contact' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Contact Information</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Section Title</label>
                                            <input
                                                type="text"
                                                value={content.footer_contact.title}
                                                onChange={(e) => handleInputChange('footer_contact', 'title', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Email</label>
                                            <input
                                                type="email"
                                                value={content.footer_contact.email}
                                                onChange={(e) => handleInputChange('footer_contact', 'email', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Phone</label>
                                            <input
                                                type="text"
                                                value={content.footer_contact.phone}
                                                onChange={(e) => handleInputChange('footer_contact', 'phone', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Address</label>
                                        <textarea
                                            value={content.footer_contact.address}
                                            onChange={(e) => handleInputChange('footer_contact', 'address', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-[#336b6e]">Opening Hours</h3>
                                            <button
                                                onClick={() => addListItem('footer_contact', 'hours', '')}
                                                className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                            >
                                                <Plus className="w-4 h-4" /> Add Hour Line
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {content.footer_contact.hours.map((hour, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={hour}
                                                        onChange={(e) => {
                                                            const newHours = [...content.footer_contact.hours]
                                                            newHours[idx] = e.target.value
                                                            handleInputChange('footer_contact', 'hours', newHours)
                                                        }}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="e.g., Mon - Fri: 9 AM - 6 PM"
                                                    />
                                                    <button onClick={() => removeListItem('footer_contact', 'hours', idx)} className="text-red-500">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('footer_contact')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Contact Changes
                                    </button>
                                </div>
                            )}

                            {/* Newsletter */}
                            {activeSection === 'footer_newsletter' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Newsletter Section</h2>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Newsletter Heading</label>
                                        <input
                                            type="text"
                                            value={content.footer_newsletter.title}
                                            onChange={(e) => handleInputChange('footer_newsletter', 'title', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Newsletter Subtitle</label>
                                        <textarea
                                            value={content.footer_newsletter.description}
                                            onChange={(e) => handleInputChange('footer_newsletter', 'description', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Input Placeholder</label>
                                            <input
                                                type="text"
                                                value={content.footer_newsletter.placeholder}
                                                onChange={(e) => handleInputChange('footer_newsletter', 'placeholder', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Button Text</label>
                                            <input
                                                type="text"
                                                value={content.footer_newsletter.button_text}
                                                onChange={(e) => handleInputChange('footer_newsletter', 'button_text', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('footer_newsletter')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Newsletter Changes
                                    </button>
                                </div>
                            )}

                            {/* Bottom Bar */}
                            {activeSection === 'footer_bottom' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Bottom Bar (Copyright & Policies)</h2>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Copyright Text</label>
                                        <input
                                            type="text"
                                            value={content.footer_bottom.copyright}
                                            onChange={(e) => handleInputChange('footer_bottom', 'copyright', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                            placeholder="© 2024 Your Company. All rights reserved."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-[#336b6e]">Policy Links</h3>
                                            <button
                                                onClick={() => addListItem('footer_bottom', 'links', { label: '', url: '' })}
                                                className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                            >
                                                <Plus className="w-4 h-4" /> Add Policy Link
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {content.footer_bottom.links.map((link, idx) => (
                                                <div key={idx} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => updateListItem('footer_bottom', 'links', idx, 'label', e.target.value)}
                                                        className="flex-1 min-w-0 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                        placeholder="Label"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={link.url}
                                                        onChange={(e) => updateListItem('footer_bottom', 'links', idx, 'url', e.target.value)}
                                                        className="flex-[1.5] min-w-0 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                                        placeholder="URL"
                                                    />
                                                    <button onClick={() => removeListItem('footer_bottom', 'links', idx)} className="text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('footer_bottom')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Bottom Bar Changes
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

export default FooterCMS
