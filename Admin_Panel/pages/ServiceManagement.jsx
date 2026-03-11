import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  Star,
  Clock,
  DollarSign,
  Tag,
  CheckCircle,
  X,
  Upload,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { uploadToCloudinary } from '../../src/utils/cloudinary'

function ServiceManagement() {
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // create or edit
  const [selectedService, setSelectedService] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    popular_tag: false,
    features: [''],
    price: '',
    duration: '',
    rating: 0,
    category: '',
    is_active: true,
    display_order: 0
  })

  // Load services
  useEffect(() => {
    loadServices()
  }, [])

  // Filter services
  useEffect(() => {
    let filtered = services

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(s => s.is_active)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(s => !s.is_active)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredServices(filtered)
  }, [services, searchQuery, filterStatus])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      setErrorMessage('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (mode, service = null) => {
    setModalMode(mode)
    setSelectedService(service)

    if (mode === 'edit' && service) {
      setFormData({
        title: service.title,
        description: service.description,
        image_url: service.image_url,
        popular_tag: service.popular_tag,
        features: service.features || [''],
        price: service.price || '',
        duration: service.duration || '',
        rating: service.rating || 0,
        category: service.category || '',
        is_active: service.is_active,
        display_order: service.display_order || 0
      })
    } else {
      setFormData({
        title: '',
        description: '',
        image_url: '',
        popular_tag: false,
        features: [''],
        price: '',
        duration: '',
        rating: 0,
        category: '',
        is_active: true,
        display_order: services.length
      })
    }

    setShowModal(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedService(null)
    setUploadProgress(0)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      const url = await uploadToCloudinary(file, 'services', (progress) => {
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

    // Validation
    if (!formData.title.trim()) {
      setErrorMessage('Title is required')
      return
    }
    if (!formData.description.trim()) {
      setErrorMessage('Description is required')
      return
    }
    if (!formData.image_url.trim()) {
      setErrorMessage('Image is required')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Filter out empty features
      const cleanFeatures = formData.features.filter(f => f.trim() !== '')

      const serviceData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        popular_tag: formData.popular_tag,
        features: cleanFeatures,
        price: formData.price || null,
        duration: formData.duration || null,
        rating: parseFloat(formData.rating) || 0,
        category: formData.category || null,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order) || 0,
        updated_by: user?.id
      }

      if (modalMode === 'create') {
        serviceData.created_by = user?.id
        const { error } = await supabase
          .from('services')
          .insert([serviceData])

        if (error) throw error
        setSuccessMessage('Service created successfully!')
      } else {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', selectedService.id)

        if (error) throw error
        setSuccessMessage('Service updated successfully!')
      }

      await loadServices()
      setTimeout(() => {
        handleCloseModal()
        setSuccessMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error saving service:', error)
      setErrorMessage(error.message || 'Failed to save service')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleServiceStatus = async (service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)

      if (error) throw error

      setSuccessMessage(`Service ${!service.is_active ? 'activated' : 'deactivated'} successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadServices()
    } catch (error) {
      console.error('Error toggling service status:', error)
      setErrorMessage('Failed to update service status')
    }
  }

  const deleteService = async (service) => {
    if (!window.confirm(`Are you sure you want to delete "${service.title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error

      setSuccessMessage('Service deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      setErrorMessage('Failed to delete service')
    }
  }

  const moveService = async (service, direction) => {
    const currentIndex = services.findIndex(s => s.id === service.id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === services.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const otherService = services[newIndex]

    try {
      // Swap display_order
      await supabase
        .from('services')
        .update({ display_order: otherService.display_order })
        .eq('id', service.id)

      await supabase
        .from('services')
        .update({ display_order: service.display_order })
        .eq('id', otherService.id)

      await loadServices()
    } catch (error) {
      console.error('Error reordering services:', error)
      setErrorMessage('Failed to reorder services')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#336b6e] mb-2">Service Management</h1>
          <p className="text-[#336b6e] opacity-70">Manage services displayed on your website</p>
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

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
              />
            </div>

            {/* Filter */}
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

            {/* Add Button */}
            <button
              onClick={() => handleOpenModal('create')}
              className="bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-xl font-semibold hover:bg-[#2a5557] transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>

        {/* Services List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No services found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredServices.map((service, index) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-64 h-48 md:h-auto relative flex-shrink-0">
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                    {service.popular_tag && (
                      <div className="absolute top-4 left-4 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Popular
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#336b6e] mb-2">{service.title}</h3>
                        <p className="text-[#336b6e] opacity-70 mb-3">{service.description}</p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 mb-3">
                          {service.category && (
                            <div className="flex items-center gap-1 text-sm text-[#336b6e]">
                              <Tag className="w-4 h-4" />
                              <span>{service.category}</span>
                            </div>
                          )}
                          {service.price && (
                            <div className="flex items-center gap-1 text-sm text-[#336b6e]">
                              <DollarSign className="w-4 h-4" />
                              <span>{service.price}</span>
                            </div>
                          )}
                          {service.duration && (
                            <div className="flex items-center gap-1 text-sm text-[#336b6e]">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration}</span>
                            </div>
                          )}
                          {service.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm text-[#336b6e]">
                              <Star className="w-4 h-4 fill-current text-[#bb9f58]" />
                              <span>{service.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        {service.features && service.features.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {service.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#fdfcf3] text-[#336b6e] rounded-full text-sm"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="ml-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => moveService(service, 'up')}
                        disabled={index === 0}
                        className="p-2 text-[#336b6e] hover:bg-[#fdfcf3] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveService(service, 'down')}
                        disabled={index === filteredServices.length - 1}
                        className="p-2 text-[#336b6e] hover:bg-[#fdfcf3] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal('edit', service)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleServiceStatus(service)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                        title={service.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {service.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteService(service)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#336b6e]">
                {modalMode === 'create' ? 'Create New Service' : 'Edit Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Success/Error Messages */}
              {successMessage && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="e.g., One-on-One Personal Training"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                  placeholder="Describe the service in detail..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Service Image *
                </label>
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Service preview"
                      className="w-full h-48 object-cover rounded-xl mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#bb9f58] transition-all bg-[#fdfcf3]/50"
                    >
                      {uploadProgress > 0 ? (
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin mx-auto mb-2" />
                          <p className="text-[#336b6e] font-medium">{uploadProgress}%</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-gray-600 font-medium">Click to upload image</p>
                          <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Row: Category, Price, Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Category
                  </label>
                  <input
                    list="category-suggestions"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                    placeholder="e.g., Personal"
                  />
                  <datalist id="category-suggestions">
                    {[...new Set(services.map(s => s.category).filter(Boolean))].map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                    placeholder="e.g., $80/session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                    placeholder="e.g., 60 mins"
                  />
                </div>
              </div>

              {/* Row: Rating, Display Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                    placeholder="e.g., 4.9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Features/Pointers */}
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Features (Pointers)
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                        placeholder={`Feature ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-[#336b6e] hover:border-[#bb9f58] hover:bg-[#fdfcf3]/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Feature
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="popular_tag"
                    checked={formData.popular_tag}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-[#336b6e] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#bb9f58] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#336b6e]">Mark as Popular</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-[#336b6e] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#bb9f58] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#336b6e]">Active</span>
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#336b6e] text-[#bb9f58] px-6 py-3 rounded-xl font-semibold hover:bg-[#2a5557] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {modalMode === 'create' ? 'Create Service' : 'Update Service'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceManagement

