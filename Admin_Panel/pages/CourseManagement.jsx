import React, { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Search,
    Image as ImageIcon,
    Clock,
    DollarSign,
    GraduationCap,
    CheckCircle,
    X,
    Upload,
    Loader2,
    AlertCircle,
    Calendar,
    Layers,
    Award,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { uploadToCloudinary } from '../../src/utils/cloudinary'

function CourseManagement() {
    const [courses, setCourses] = useState([])
    const [filteredCourses, setFilteredCourses] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState('create') // create or edit
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        duration: '',
        price: '',
        level: 'Beginner',
        certification: '',
        image_url: '',
        is_active: true,
        curriculum: [''],
        schedule: '',
        display_order: 0,
        meta_title: '',
        meta_description: '',
        meta_keywords: ''
    })

    // Load courses
    useEffect(() => {
        loadCourses()
    }, [])

    // Filter courses
    useEffect(() => {
        let filtered = courses

        // Filter by status
        if (filterStatus === 'active') {
            filtered = filtered.filter(c => c.is_active)
        } else if (filterStatus === 'inactive') {
            filtered = filtered.filter(c => !c.is_active)
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredCourses(filtered)
    }, [courses, searchQuery, filterStatus])

    const loadCourses = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('display_order', { ascending: true })

            if (error) throw error
            setCourses(data || [])
        } catch (error) {
            console.error('Error loading courses:', error)
            setErrorMessage('Failed to load courses. Make sure the table exists.')
        } finally {
            setIsLoading(false)
        }
    }

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
    }

    const handleOpenModal = (mode, course = null) => {
        setModalMode(mode)
        setSelectedCourse(course)

        if (mode === 'edit' && course) {
            setFormData({
                title: course.title,
                slug: course.slug,
                description: course.description || '',
                duration: course.duration || '',
                price: course.price || '',
                level: course.level || 'Beginner',
                certification: course.certification || '',
                image_url: course.image_url || '',
                is_active: course.is_active,
                curriculum: (course.curriculum && course.curriculum.length > 0) ? course.curriculum : [''],
                schedule: course.schedule || '',
                display_order: course.display_order || 0,
                meta_title: course.meta_title || '',
                meta_description: course.meta_description || '',
                meta_keywords: course.meta_keywords || ''
            })
        } else {
            setFormData({
                title: '',
                slug: '',
                description: '',
                duration: '',
                price: '',
                level: 'Beginner',
                certification: '',
                image_url: '',
                is_active: true,
                curriculum: [''],
                schedule: '',
                display_order: 0,
                meta_title: '',
                meta_description: '',
                meta_keywords: ''
            })
        }

        setShowModal(true)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedCourse(null)
        setUploadProgress(0)
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        const newValue = type === 'checkbox' ? checked : value

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue }
            // Auto-generate slug if title changes in create mode
            if (name === 'title' && modalMode === 'create') {
                updated.slug = generateSlug(value)
            }
            return updated
        })
    }

    const handleCurriculumChange = (index, value) => {
        const newCurriculum = [...formData.curriculum]
        newCurriculum[index] = value
        setFormData(prev => ({ ...prev, curriculum: newCurriculum }))
    }

    const addCurriculumItem = () => {
        setFormData(prev => ({ ...prev, curriculum: [...prev.curriculum, ''] }))
    }

    const removeCurriculumItem = (index) => {
        const newCurriculum = formData.curriculum.filter((_, i) => i !== index)
        setFormData(prev => ({ ...prev, curriculum: newCurriculum.length > 0 ? newCurriculum : [''] }))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setIsSubmitting(true)
            setUploadProgress(0)

            const url = await uploadToCloudinary(file, 'courses', (progress) => {
                setUploadProgress(progress)
            })

            setFormData(prev => ({ ...prev, image_url: url }))
            setSuccessMessage('Image uploaded successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Error uploading image:', error)
            setErrorMessage('Failed to upload image')
        } finally {
            setIsSubmitting(false)
            setUploadProgress(0)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        if (!formData.title.trim()) {
            setErrorMessage('Title is required')
            return
        }
        if (!formData.slug.trim()) {
            setErrorMessage('Slug is required')
            return
        }

        setIsSubmitting(true)

        try {
            // Filter out empty curriculum items
            const cleanCurriculum = formData.curriculum.filter(item => item.trim() !== '')

            const courseData = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                duration: formData.duration,
                price: formData.price ? parseFloat(formData.price) : null,
                level: formData.level,
                certification: formData.certification,
                image_url: formData.image_url,
                is_active: formData.is_active,
                curriculum: cleanCurriculum,
                schedule: formData.schedule,
                display_order: parseInt(formData.display_order) || 0,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                meta_keywords: formData.meta_keywords || null
            }

            if (modalMode === 'create') {
                const { error } = await supabase
                    .from('courses')
                    .insert([courseData])

                if (error) {
                    if (error.code === '23505') throw new Error('A course with this slug already exists')
                    throw error
                }
                setSuccessMessage('Course created successfully!')
            } else {
                const { error } = await supabase
                    .from('courses')
                    .update(courseData)
                    .eq('id', selectedCourse.id)

                if (error) throw error
                setSuccessMessage('Course updated successfully!')
            }

            await loadCourses()
            setTimeout(() => {
                handleCloseModal()
                setSuccessMessage('')
            }, 1500)
        } catch (error) {
            console.error('Error saving course:', error)
            setErrorMessage(error.message || 'Failed to save course')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleCourseStatus = async (course) => {
        try {
            const { error } = await supabase
                .from('courses')
                .update({ is_active: !course.is_active })
                .eq('id', course.id)

            if (error) throw error

            setSuccessMessage(`Course ${!course.is_active ? 'activated' : 'deactivated'} successfully!`)
            setTimeout(() => setSuccessMessage(''), 3000)
            await loadCourses()
        } catch (error) {
            console.error('Error toggling course status:', error)
            setErrorMessage('Failed to update course status')
        }
    }

    const updateDisplayOrder = async (id, newOrder) => {
        try {
            const { error } = await supabase
                .from('courses')
                .update({ display_order: newOrder })
                .eq('id', id)

            if (error) throw error
            await loadCourses()
        } catch (error) {
            console.error('Error updating order:', error)
            setErrorMessage('Failed to update order')
        }
    }

    const deleteCourse = async (course) => {
        if (!window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', course.id)

            if (error) throw error

            setSuccessMessage('Course deleted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
            await loadCourses()
        } catch (error) {
            console.error('Error deleting course:', error)
            setErrorMessage('Failed to delete course')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-[#336b6e] mb-2">YTTC Course Management</h1>
                        <p className="text-[#336b6e] opacity-70">Manage Yoga Teacher Training Courses</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal('create')}
                        className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-xl font-semibold hover:bg-[#2a5557] transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Course
                    </button>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">{errorMessage}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'all'
                                    ? 'bg-[#336b6e] text-[#bb9f58]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'active'
                                    ? 'bg-[#336b6e] text-[#bb9f58]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilterStatus('inactive')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'inactive'
                                    ? 'bg-[#336b6e] text-[#bb9f58]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>
                </div>

                {/* Courses Table/Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No courses found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                                <div className="relative h-48">
                                    <img
                                        src={course.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {course.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-[#bb9f58] text-[#336b6e] px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
                                            Order: {course.display_order || 0}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-[#336b6e] text-[#bb9f58] px-3 py-1 rounded-lg text-xs font-bold">
                                            {course.level}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-[#336b6e] mb-2 line-clamp-1">{course.title}</h3>
                                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {course.duration}
                                        </div>
                                        {course.price && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {course.price}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6 line-clamp-2 h-10">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal('edit', course)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Course"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => toggleCourseStatus(course)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                                title={course.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {course.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => updateDisplayOrder(course.id, (course.display_order || 0) - 1)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Move Up"
                                            >
                                                <ArrowUp className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => updateDisplayOrder(course.id, (course.display_order || 0) + 1)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Move Down"
                                            >
                                                <ArrowDown className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteCourse(course)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Course"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            /{course.slug}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Course Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-[#336b6e]">
                                {modalMode === 'create' ? 'Create YTTC Course' : 'Edit YTTC Course'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Course Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Slug (URL) *</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none bg-gray-50"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Course Level</label>
                                        <select
                                            name="level"
                                            value={formData.level}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent outline-none"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                            <option value="Multi-level">Multi-level</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#336b6e] mb-1">Duration</label>
                                            <input
                                                type="text"
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 200 Hours"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#336b6e] mb-1">Price</label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Display Order</label>
                                        <input
                                            type="number"
                                            name="display_order"
                                            value={formData.display_order}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Certification</label>
                                        <input
                                            type="text"
                                            name="certification"
                                            value={formData.certification}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Yoga Alliance Certified"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Image and Actions */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Course Image</label>
                                        {formData.image_url ? (
                                            <div className="relative group">
                                                <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative border-2 border-dashed border-gray-200 rounded-lg h-40 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                                                <input
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                />
                                                {uploadProgress > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 className="w-8 h-8 text-[#336b6e] animate-spin mb-2" />
                                                        <span className="text-xs font-bold text-[#336b6e]">{uploadProgress}%</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm font-medium text-gray-500">Upload Course Image</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#336b6e] mb-1">Schedule / Logistics</label>
                                        <textarea
                                            name="schedule"
                                            value={formData.schedule}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                            placeholder="e.g. Starting next month, weekends only"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-[#336b6e] border-gray-300 rounded focus:ring-[#336b6e]"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-bold text-[#336b6e]">Course is Active</label>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width: Description */}
                            <div>
                                <label className="block text-sm font-semibold text-[#336b6e] mb-1">Course Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                    placeholder="Detailed explanation of the course content and goals..."
                                />
                            </div>

                            {/* Curriculum Editor */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-[#336b6e] flex items-center gap-2">
                                        <Layers className="w-5 h-5" />
                                        Curriculum Topics
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addCurriculumItem}
                                        className="flex items-center gap-1 text-[#bb9f58] hover:text-[#a08a4a] text-sm font-bold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Topic
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.curriculum.map((topic, index) => (
                                        <div key={index} className="flex gap-2">
                                            <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-gray-100 rounded text-gray-400 font-bold text-xs">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => handleCurriculumChange(index, e.target.value)}
                                                placeholder={`e.g. History of Hatha Yoga`}
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCurriculumItem(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-[#336b6e] text-[#bb9f58] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2a5557] transition-all disabled:opacity-50 shadow-xl"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Award className="w-6 h-6" />
                                        {modalMode === 'create' ? 'Create Course' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CourseManagement
