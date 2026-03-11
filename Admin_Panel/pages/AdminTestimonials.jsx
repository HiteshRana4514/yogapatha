import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  X,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Award
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    client_name: '',
    client_designation: '',
    client_image_url: '',
    testimonial_text: '',
    rating: 5,
    is_featured: false,
    display_order: 0,
    status: 'active'
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      alert('Failed to fetch testimonials: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, client_image_url: data.secure_url }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.client_name || !formData.testimonial_text) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingTestimonial) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingTestimonial.id)

        if (error) throw error
        alert('Testimonial updated successfully!')
      } else {
        // Create new testimonial
        const { error } = await supabase
          .from('testimonials')
          .insert([formData])

        if (error) throw error
        alert('Testimonial created successfully!')
      }

      fetchTestimonials()
      closeModal()
    } catch (error) {
      console.error('Error saving testimonial:', error)
      alert('Failed to save testimonial: ' + error.message)
    }
  }

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial)
    setFormData({
      client_name: testimonial.client_name,
      client_designation: testimonial.client_designation || '',
      client_image_url: testimonial.client_image_url || '',
      testimonial_text: testimonial.testimonial_text,
      rating: testimonial.rating,
      is_featured: testimonial.is_featured,
      display_order: testimonial.display_order,
      status: testimonial.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Testimonial deleted successfully!')
      fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      alert('Failed to delete testimonial: ' + error.message)
    }
  }

  const toggleStatus = async (testimonial) => {
    try {
      const newStatus = testimonial.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('testimonials')
        .update({ status: newStatus })
        .eq('id', testimonial.id)

      if (error) throw error
      fetchTestimonials()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const updateDisplayOrder = async (id, newOrder) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ display_order: newOrder })
        .eq('id', id)

      if (error) throw error
      fetchTestimonials()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTestimonial(null)
    setFormData({
      client_name: '',
      client_designation: '',
      client_image_url: '',
      testimonial_text: '',
      rating: 5,
      is_featured: false,
      display_order: 0,
      status: 'active'
    })
  }

  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#336b6e] mb-2">Testimonials Management</h1>
          <p className="text-gray-600">Manage client testimonials and reviews</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Testimonial
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No testimonials found</h3>
            <p className="text-gray-500">Start by adding your first testimonial</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {testimonial.client_image_url ? (
                        <img
                          src={testimonial.client_image_url}
                          alt={testimonial.client_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#bb9f58] flex items-center justify-center text-white font-bold text-lg">
                          {testimonial.client_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{testimonial.client_name}</h3>
                        <p className="text-xs text-white/80">{testimonial.client_designation || 'Client'}</p>
                      </div>
                    </div>
                    {testimonial.is_featured && (
                      <Award className="w-5 h-5 text-[#bb9f58]" />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'fill-[#bb9f58] text-[#bb9f58]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                    {testimonial.testimonial_text}
                  </p>

                  {/* Status & Order */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      testimonial.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {testimonial.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Order: {testimonial.display_order}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(testimonial)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      title={testimonial.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {testimonial.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => updateDisplayOrder(testimonial.id, testimonial.display_order - 1)}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateDisplayOrder(testimonial.id, testimonial.display_order + 1)}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(testimonial)}
                      className="px-3 py-2 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Client Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>

                {/* Client Designation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="client_designation"
                    value={formData.client_designation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                {/* Client Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Image
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.client_image_url && (
                      <img
                        src={formData.client_image_url}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#336b6e] transition-colors flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Testimonial Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Testimonial <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="testimonial_text"
                    value={formData.testimonial_text}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    placeholder="Enter testimonial text..."
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= formData.rating
                              ? 'fill-[#bb9f58] text-[#bb9f58]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-[#336b6e] rounded focus:ring-[#336b6e]"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        status: e.target.checked ? 'active' : 'inactive'
                      }))}
                      className="w-5 h-5 text-[#336b6e] rounded focus:ring-[#336b6e]"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingTestimonial ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTestimonials
