import React, { useState, useEffect } from 'react'
import {
    Save,
    Layout,
    Phone,
    Mail,
    MessageCircle,
    Calendar,
    MapPin,
    Clock,
    Plus,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    Navigation,
    Heart,
    Type,
    Upload
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { uploadToCloudinary } from '../../src/utils/cloudinary'

function ContactUsCMS() {
    const [activeSection, setActiveSection] = useState('hero')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState({})
    const [status, setStatus] = useState({ type: '', message: '' })
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadingImageIdx, setUploadingImageIdx] = useState(null)

    const sections = [
        { id: 'hero', label: 'Hero Section', icon: Layout },
        { id: 'methods', label: 'Contact Methods', icon: Phone },
        { id: 'info_cards', label: 'Info & Promise', icon: Heart },
        { id: 'locations', label: 'Office Locations', icon: MapPin },
        { id: 'cta', label: 'CTA Section', icon: Type },
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
                .eq('page_name', 'contact_us')

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

    const handleDeepArrayChange = (section, field, index, subfield, value) => {
        const updatedArray = [...content[section][field]]
        updatedArray[index] = { ...updatedArray[index], [subfield]: value }
        handleInputChange(section, field, updatedArray)
    }

    const handleLocationImageUpload = async (index, file) => {
        if (!file) return;
        setUploadingImageIdx(index);
        setUploadProgress(0);
        setStatus({ type: '', message: '' });

        try {
            const url = await uploadToCloudinary(file, 'locations', (progress) => {
                setUploadProgress(progress);
            });
            handleArrayChange('locations', index, 'image', url);
            setStatus({ type: 'success', message: 'Image uploaded successfully!' });
        } catch (error) {
            console.error('Error uploading image:', error);
            setStatus({ type: 'error', message: 'Failed to upload image' });
        } finally {
            setUploadingImageIdx(null);
            setUploadProgress(0);
        }
    };

    const addLocation = () => {
        const newLocation = {
            id: Date.now(),
            name: "New Office Location",
            address: "",
            phone: "",
            hours: {
                weekdays: "9:00 AM - 6:00 PM",
                saturday: "10:00 AM - 4:00 PM",
                sunday: "Closed"
            },
            features: [],
            image: "",
            map_iframe: ""
        }

        setContent(prev => ({
            ...prev,
            locations: [...(prev.locations || []), newLocation]
        }))
    }

    const removeLocation = (index) => {
        if (!window.confirm('Are you sure you want to remove this location?')) return

        const updatedLocations = [...content.locations]
        updatedLocations.splice(index, 1)
        setContent(prev => ({
            ...prev,
            locations: updatedLocations
        }))
    }

    const handleSave = async (section) => {
        setSaving(true)
        setStatus({ type: '', message: '' })
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    page_name: 'contact_us',
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
                        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Contact Us CMS</h1>
                        <p className="text-gray-600">Manage how clients reach out to your team</p>
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
                                            <label className="text-sm font-semibold text-[#336b6e]">Heading Prefix</label>
                                            <input
                                                type="text"
                                                value={content.hero.heading_main || ''}
                                                onChange={(e) => handleInputChange('hero', 'heading_main', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Highlight Text</label>
                                            <input
                                                type="text"
                                                value={content.hero.heading_highlight || ''}
                                                onChange={(e) => handleInputChange('hero', 'heading_highlight', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Subtitle</label>
                                        <textarea
                                            value={content.hero.subtitle || ''}
                                            onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
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

                            {/* Methods Editor */}
                            {activeSection === 'methods' && content.methods && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Contact Methods Editor</h2>

                                    <div className="space-y-6">
                                        {content.methods.map((method, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 bg-[#336b6e] text-white rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                                        <span className="font-bold text-[#336b6e]">Method Card</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Title</label>
                                                        <input
                                                            type="text"
                                                            value={method.title}
                                                            onChange={(e) => handleArrayChange('methods', idx, 'title', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Value / Action Info</label>
                                                        {method.title?.toLowerCase().includes('call us') ? (
                                                            <div className="space-y-2">
                                                                {(method.value || '').split(',').map((num, nIdx, arr) => (
                                                                    <div key={nIdx} className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={num.trim()}
                                                                            onChange={(e) => {
                                                                                const newNums = [...arr];
                                                                                newNums[nIdx] = e.target.value;
                                                                                handleArrayChange('methods', idx, 'value', newNums.join(','));
                                                                                // Also update action for the first number if it exists
                                                                                if (nIdx === 0) {
                                                                                    handleArrayChange('methods', idx, 'action', `tel:${e.target.value.replace(/\s+/g, '')}`);
                                                                                }
                                                                            }}
                                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] font-semibold text-[#bb9f58]"
                                                                            placeholder="Phone number"
                                                                        />
                                                                        {arr.length > 1 && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newNums = arr.filter((_, i) => i !== nIdx);
                                                                                    handleArrayChange('methods', idx, 'value', newNums.join(','));
                                                                                }}
                                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const currentVal = method.value || '';
                                                                        const newVal = currentVal ? `${currentVal}, ` : '';
                                                                        handleArrayChange('methods', idx, 'value', newVal);
                                                                    }}
                                                                    className="flex items-center gap-1 text-xs font-bold text-[#336b6e] hover:text-[#bb9f58] transition-colors"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add Number
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={method.value}
                                                                onChange={(e) => handleArrayChange('methods', idx, 'value', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Description</label>
                                                    <input
                                                        type="text"
                                                        value={method.description}
                                                        onChange={(e) => handleArrayChange('methods', idx, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Icon Name</label>
                                                        <input
                                                            type="text"
                                                            value={method.icon}
                                                            onChange={(e) => handleArrayChange('methods', idx, 'icon', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] font-mono text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Action Link (e.g., tel:..., mailto:...)</label>
                                                        <input
                                                            type="text"
                                                            value={method.action}
                                                            onChange={(e) => handleArrayChange('methods', idx, 'action', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleSave('methods')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Methods Changes
                                    </button>
                                </div>
                            )}

                            {/* Info Cards & Promise Editor */}
                            {activeSection === 'info_cards' && content.info_cards && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">Info & Promise Editor</h2>

                                    {/* General Info */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#336b6e]">Connect Section Header</h3>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-500">Heading</label>
                                            <input
                                                type="text"
                                                value={content.info_cards.heading || ''}
                                                onChange={(e) => handleInputChange('info_cards', 'heading', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-500">Description</label>
                                            <textarea
                                                value={content.info_cards.description || ''}
                                                onChange={(e) => handleInputChange('info_cards', 'description', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Info Cards */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#336b6e]">Quick Info Cards</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {content.info_cards.cards.map((card, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-gray-500">Title</label>
                                                            <input
                                                                type="text"
                                                                value={card.title}
                                                                onChange={(e) => handleDeepArrayChange('info_cards', 'cards', idx, 'title', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-gray-500">Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={card.subtitle}
                                                                onChange={(e) => handleDeepArrayChange('info_cards', 'cards', idx, 'subtitle', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-gray-500">Value</label>
                                                            {card.title?.toLowerCase().includes('call us') ? (
                                                                <div className="space-y-2">
                                                                    {(card.value || '').split(',').map((num, nIdx, arr) => (
                                                                        <div key={nIdx} className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={num.trim()}
                                                                                onChange={(e) => {
                                                                                    const newNums = [...arr];
                                                                                    newNums[nIdx] = e.target.value;
                                                                                    handleDeepArrayChange('info_cards', 'cards', idx, 'value', newNums.join(','));
                                                                                    // Also update action for the first number if it exists
                                                                                    if (nIdx === 0) {
                                                                                        handleDeepArrayChange('info_cards', 'cards', idx, 'action', `tel:${e.target.value.replace(/\s+/g, '')}`);
                                                                                    }
                                                                                }}
                                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-semibold text-[#bb9f58]"
                                                                                placeholder="Phone number"
                                                                            />
                                                                            {arr.length > 1 && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newNums = arr.filter((_, i) => i !== nIdx);
                                                                                        handleDeepArrayChange('info_cards', 'cards', idx, 'value', newNums.join(','));
                                                                                    }}
                                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => {
                                                                            const currentVal = card.value || '';
                                                                            const newVal = currentVal ? `${currentVal}, ` : '';
                                                                            handleDeepArrayChange('info_cards', 'cards', idx, 'value', newVal);
                                                                        }}
                                                                        className="flex items-center gap-1 text-xs font-bold text-[#336b6e] hover:text-[#bb9f58] transition-colors"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        Add Number
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={card.value}
                                                                    onChange={(e) => handleDeepArrayChange('info_cards', 'cards', idx, 'value', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold text-[#bb9f58]"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-gray-500">Icon</label>
                                                            <input
                                                                type="text"
                                                                value={card.icon}
                                                                onChange={(e) => handleDeepArrayChange('info_cards', 'cards', idx, 'icon', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Promise List */}
                                    <div className="space-y-4 p-4 bg-[#336b6e]/5 rounded-xl">
                                        <h3 className="font-bold text-[#336b6e]">Response Promise</h3>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-500">Promise Title</label>
                                            <input
                                                type="text"
                                                value={content.info_cards.promise.title || ''}
                                                onChange={(e) => {
                                                    const newPromise = { ...content.info_cards.promise, title: e.target.value }
                                                    handleInputChange('info_cards', 'promise', newPromise)
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-500">Promise Items (One per line)</label>
                                            <textarea
                                                value={content.info_cards.promise.items ? content.info_cards.promise.items.join('\n') : ''}
                                                onChange={(e) => {
                                                    const newPromise = { ...content.info_cards.promise, items: e.target.value.split('\n').filter(s => s.trim()) }
                                                    handleInputChange('info_cards', 'promise', newPromise)
                                                }}
                                                rows="4"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('info_cards')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Info Changes
                                    </button>
                                </div>
                            )}

                            {/* Locations Editor */}
                            {activeSection === 'locations' && content.locations && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                                        <h2 className="text-2xl font-bold text-[#336b6e]">Locations Editor</h2>
                                        <button
                                            onClick={addLocation}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#bb9f58] text-white rounded-lg font-bold hover:bg-[#a08a4a] transition-all text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Location
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        {content.locations.map((loc, idx) => (
                                            <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <span className="w-8 h-8 bg-[#bb9f58] text-white rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={loc.name}
                                                            onChange={(e) => handleArrayChange('locations', idx, 'name', e.target.value)}
                                                            className="text-xl font-bold text-[#336b6e] bg-transparent border-none focus:ring-0 p-0 flex-1"
                                                            placeholder="Location Name"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeLocation(idx)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Location"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Address</label>
                                                        <input
                                                            type="text"
                                                            value={loc.address}
                                                            onChange={(e) => handleArrayChange('locations', idx, 'address', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Phone</label>
                                                        <input
                                                            type="text"
                                                            value={loc.phone}
                                                            onChange={(e) => handleArrayChange('locations', idx, 'phone', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Weekday Hours</label>
                                                        <input
                                                            type="text"
                                                            value={loc.hours.weekdays}
                                                            onChange={(e) => {
                                                                const newHours = { ...loc.hours, weekdays: e.target.value }
                                                                handleArrayChange('locations', idx, 'hours', newHours)
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Saturday Hours</label>
                                                        <input
                                                            type="text"
                                                            value={loc.hours.saturday}
                                                            onChange={(e) => {
                                                                const newHours = { ...loc.hours, saturday: e.target.value }
                                                                handleArrayChange('locations', idx, 'hours', newHours)
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Sunday Hours</label>
                                                        <input
                                                            type="text"
                                                            value={loc.hours.sunday}
                                                            onChange={(e) => {
                                                                const newHours = { ...loc.hours, sunday: e.target.value }
                                                                handleArrayChange('locations', idx, 'hours', newHours)
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Image URL</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                value={loc.image}
                                                                onChange={(e) => handleArrayChange('locations', idx, 'image', e.target.value)}
                                                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm truncate"
                                                                placeholder="Upload or paste image URL"
                                                            />
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleLocationImageUpload(idx, e.target.files[0])}
                                                                    disabled={uploadingImageIdx === idx}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                    title="Upload Image"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingImageIdx === idx}
                                                                    className="px-3 py-2 bg-[#336b6e] text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-[#2a5557]"
                                                                >
                                                                    {uploadingImageIdx === idx ? (
                                                                        <span className="text-xs font-bold w-5 text-center">{uploadProgress}%</span>
                                                                    ) : (
                                                                        <Upload className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-gray-500">Features (Comma separated)</label>
                                                        <input
                                                            type="text"
                                                            value={loc.features ? loc.features.join(', ') : ''}
                                                            onChange={(e) => handleArrayChange('locations', idx, 'features', e.target.value.split(',').map(s => s.trim()))}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500">Google Maps Iframe URL (Recommended) or Embed Code</label>
                                                    <textarea
                                                        value={loc.map_iframe || ''}
                                                        onChange={(e) => handleArrayChange('locations', idx, 'map_iframe', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono h-24"
                                                        placeholder="Paste your Google Maps iframe embed code or src URL here"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleSave('locations')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Locations Changes
                                    </button>
                                </div>
                            )}

                            {/* CTA Editor */}
                            {activeSection === 'cta' && content.cta && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[#336b6e] border-b pb-4">CTA Section Editor</h2>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Heading</label>
                                        <input
                                            type="text"
                                            value={content.cta.heading || ''}
                                            onChange={(e) => handleInputChange('cta', 'heading', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#336b6e]">Subtitle</label>
                                        <textarea
                                            value={content.cta.subtitle || ''}
                                            onChange={(e) => handleInputChange('cta', 'subtitle', e.target.value)}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Primary Button Text</label>
                                            <input
                                                type="text"
                                                value={content.cta.button_1 || ''}
                                                onChange={(e) => handleInputChange('cta', 'button_1', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#336b6e]">Secondary Button Text</label>
                                            <input
                                                type="text"
                                                value={content.cta.button_2 || ''}
                                                onChange={(e) => handleInputChange('cta', 'button_2', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSave('cta')}
                                        disabled={saving}
                                        className="w-full py-4 bg-[#336b6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save CTA Changes
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

export default ContactUsCMS
