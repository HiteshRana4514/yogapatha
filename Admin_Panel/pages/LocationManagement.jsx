import React, { useState, useEffect } from 'react'
import supabase from '../../src/supabase/supabse'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Image as ImageIcon,
  Upload
} from 'lucide-react'

function LocationManagement() {
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState(null)
  const [showStateModal, setShowStateModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [editingState, setEditingState] = useState(null)
  const [editingCity, setEditingCity] = useState(null)
  const [expandedStates, setExpandedStates] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [stateForm, setStateForm] = useState({
    id: '',
    name: '',
    slug: '',
    image: '',
    display_order: 0,
    is_active: true
  })

  const [cityForm, setCityForm] = useState({
    id: '',
    state_id: '',
    name: '',
    slug: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchStates()
    fetchCities()
  }, [])

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setStates(data || [])
    } catch (error) {
      console.error('Error fetching states:', error)
      alert('Failed to fetch states')
    } finally {
      setLoading(false)
    }
  }

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('state_id, display_order', { ascending: true })

      if (error) throw error
      setCities(data || [])
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const getCitiesByState = (stateId) => {
    return cities.filter(city => city.state_id === stateId)
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
    formData.append('folder', 'yogapatha/locations/states')
    // Enable eager transformations for optimized versions
    // formData.append('eager', 'c_fill,w_800,h_600,q_auto,f_auto')

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

    // Return optimized URL with transformations
    // This creates an optimized version: auto format, auto quality, 800x600
    const optimizedUrl = data.secure_url.replace(
      '/upload/',
      '/upload/c_fill,w_800,h_600,q_auto,f_auto/'
    )

    return optimizedUrl
  }

  const handleStateSubmit = async (e) => {
    e.preventDefault()

    try {
      setUploadingImage(true)
      let imageUrl = stateForm.image

      // Upload image to Cloudinary if a new file is selected
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile)
      }

      if (editingState) {
        // Update existing state
        const { error } = await supabase
          .from('states')
          .update({
            name: stateForm.name,
            slug: stateForm.slug,
            image: imageUrl,
            display_order: stateForm.display_order,
            is_active: stateForm.is_active,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', stateForm.id)

        if (error) throw error
        alert('State updated successfully!')
      } else {
        // Create new state
        const { error } = await supabase
          .from('states')
          .insert([{
            id: stateForm.id,
            name: stateForm.name,
            slug: stateForm.slug,
            image: imageUrl,
            display_order: stateForm.display_order,
            is_active: stateForm.is_active,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])

        if (error) throw error
        alert('State created successfully!')
      }

      fetchStates()
      closeStateModal()
    } catch (error) {
      console.error('Error saving state:', error)
      alert('Failed to save state: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCitySubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingCity) {
        // Update existing city
        const { error } = await supabase
          .from('cities')
          .update({
            name: cityForm.name,
            slug: cityForm.slug,
            display_order: cityForm.display_order,
            is_active: cityForm.is_active,
            client_count: cityForm.client_count,
            session_count: cityForm.session_count,
            review_count: cityForm.review_count,
            whatsapp_number: cityForm.whatsapp_number,
            whatsapp_message: cityForm.whatsapp_message,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', cityForm.id)

        if (error) throw error
        alert('City updated successfully!')
      } else {
        // Create new city
        const { error } = await supabase
          .from('cities')
          .insert([{
            slug: cityForm.slug,
            display_order: cityForm.display_order,
            is_active: cityForm.is_active,
            client_count: cityForm.client_count,
            session_count: cityForm.session_count,
            review_count: cityForm.review_count,
            whatsapp_number: cityForm.whatsapp_number,
            whatsapp_message: cityForm.whatsapp_message,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])

        if (error) throw error
        alert('City created successfully!')
      }

      fetchCities()
      closeCityModal()
    } catch (error) {
      console.error('Error saving city:', error)
      alert('Failed to save city: ' + error.message)
    }
  }

  const deleteState = async (stateId) => {
    if (!confirm('Are you sure you want to delete this state? All cities in this state will also be deleted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('states')
        .delete()
        .eq('id', stateId)

      if (error) throw error
      alert('State deleted successfully!')
      fetchStates()
      fetchCities()
    } catch (error) {
      console.error('Error deleting state:', error)
      alert('Failed to delete state: ' + error.message)
    }
  }

  const deleteCity = async (cityId) => {
    if (!confirm('Are you sure you want to delete this city?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId)

      if (error) throw error
      alert('City deleted successfully!')
      fetchCities()
    } catch (error) {
      console.error('Error deleting city:', error)
      alert('Failed to delete city: ' + error.message)
    }
  }

  const toggleStateActive = async (stateId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('states')
        .update({ is_active: !currentStatus })
        .eq('id', stateId)

      if (error) throw error
      fetchStates()
    } catch (error) {
      console.error('Error toggling state:', error)
      alert('Failed to toggle state status')
    }
  }

  const toggleCityActive = async (cityId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_active: !currentStatus })
        .eq('id', cityId)

      if (error) throw error
      fetchCities()
    } catch (error) {
      console.error('Error toggling city:', error)
      alert('Failed to toggle city status')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setStateForm({ ...stateForm, image: '' })
  }

  const openStateModal = (state = null) => {
    if (state) {
      setEditingState(state)
      setStateForm(state)
      setImagePreview(state.image || null)
      setImageFile(null)
    } else {
      setEditingState(null)
      setStateForm({
        id: '',
        name: '',
        slug: '',
        image: '',
        display_order: states.length,
        is_active: true
      })
      setImagePreview(null)
      setImageFile(null)
    }
    setShowStateModal(true)
  }

  const openCityModal = (stateId, city = null) => {
    if (city) {
      setEditingCity(city)
      setCityForm(city)
    } else {
      setEditingCity(null)
      const stateCities = getCitiesByState(stateId)
      setCityForm({
        id: '',
        state_id: stateId,
        name: '',
        slug: '',
        display_order: stateCities.length,
        is_active: true,
        client_count: 0,
        session_count: 0,
        review_count: 0,
        whatsapp_number: '',
        whatsapp_message: ''
      })
    }
    setShowCityModal(true)
  }

  const closeStateModal = () => {
    setShowStateModal(false)
    setEditingState(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const closeCityModal = () => {
    setShowCityModal(false)
    setEditingCity(null)
  }

  const toggleStateExpanded = (stateId) => {
    setExpandedStates(prev => ({
      ...prev,
      [stateId]: !prev[stateId]
    }))
  }

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#336b6e]" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Location Management</h1>
            <p className="text-gray-600">Manage states and cities for the location pages</p>
          </div>
          <button
            onClick={() => openStateModal()}
            className="flex items-center gap-2 bg-[#336b6e] text-white px-6 py-3 rounded-lg hover:bg-[#2a5557] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add State
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total States</p>
              <p className="text-3xl font-bold text-[#336b6e]">{states.length}</p>
            </div>
            <MapPin className="w-12 h-12 text-[#336b6e] opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Cities</p>
              <p className="text-3xl font-bold text-[#336b6e]">{cities.length}</p>
            </div>
            <Building2 className="w-12 h-12 text-[#336b6e] opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active States</p>
              <p className="text-3xl font-bold text-[#336b6e]">
                {states.filter(s => s.is_active).length}
              </p>
            </div>
            <Eye className="w-12 h-12 text-[#336b6e] opacity-20" />
          </div>
        </div>
      </div>

      {/* States List */}
      <div className="space-y-4">
        {states.map((state) => {
          const stateCities = getCitiesByState(state.id)
          const isExpanded = expandedStates[state.id]

          return (
            <div key={state.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* State Header */}
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-4 flex-1">
                  {state.image && (
                    <img
                      src={state.image}
                      alt={state.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#336b6e]">{state.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${state.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {state.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Slug: <span className="font-mono">{state.slug}</span> •
                      {stateCities.length} {stateCities.length === 1 ? 'city' : 'cities'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStateActive(state.id, state.is_active)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={state.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {state.is_active ? (
                      <Eye className="w-5 h-5 text-green-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openCityModal(state.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Add City"
                  >
                    <Plus className="w-5 h-5 text-[#336b6e]" />
                  </button>
                  <button
                    onClick={() => openStateModal(state)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit State"
                  >
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => deleteState(state.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete State"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                  <button
                    onClick={() => toggleStateExpanded(state.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cities List */}
              {isExpanded && (
                <div className="p-6 bg-gray-50">
                  {stateCities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No cities added yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stateCities.map((city) => (
                        <div
                          key={city.id}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-[#336b6e]">{city.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${city.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {city.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3 font-mono">{city.slug}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCityActive(city.id, city.is_active)}
                              className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            >
                              {city.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => openCityModal(state.id, city)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => deleteCity(city.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* State Modal */}
      {showStateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#336b6e]">
                  {editingState ? 'Edit State' : 'Add New State'}
                </h2>
                <button onClick={closeStateModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State ID *
                </label>
                <input
                  type="text"
                  value={stateForm.id}
                  onChange={(e) => setStateForm({ ...stateForm, id: e.target.value })}
                  disabled={editingState}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., maharashtra"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (used in database)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State Name *
                </label>
                <input
                  type="text"
                  value={stateForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setStateForm({
                      ...stateForm,
                      name,
                      slug: generateSlug(name)
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="e.g., Maharashtra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={stateForm.slug}
                  onChange={(e) => setStateForm({ ...stateForm, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="e.g., maharashtra"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly version (auto-generated)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State Image
                </label>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#336b6e] hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {imageFile ? imageFile.name : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload an image. Supported formats: JPG, PNG, WebP. Cloudinary will automatically optimize it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={stateForm.display_order}
                  onChange={(e) => setStateForm({ ...stateForm, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="state-active"
                  checked={stateForm.is_active}
                  onChange={(e) => setStateForm({ ...stateForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#336b6e] border-gray-300 rounded focus:ring-[#336b6e]"
                />
                <label htmlFor="state-active" className="text-sm font-medium text-gray-700">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#336b6e] text-white px-6 py-3 rounded-lg hover:bg-[#2a5557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Image...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingState ? 'Update State' : 'Create State'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeStateModal}
                  disabled={uploadingImage}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#336b6e]">
                  {editingCity ? 'Edit City' : 'Add New City'}
                </h2>
                <button onClick={closeCityModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCitySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City ID *
                </label>
                <input
                  type="text"
                  value={cityForm.id}
                  onChange={(e) => setCityForm({ ...cityForm, id: e.target.value })}
                  disabled={editingCity}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., mumbai"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (used in database)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Name *
                </label>
                <input
                  type="text"
                  value={cityForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setCityForm({
                      ...cityForm,
                      name,
                      slug: generateSlug(name)
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={cityForm.slug}
                  onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="e.g., mumbai"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly version (auto-generated)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Count
                  </label>
                  <input
                    type="number"
                    value={cityForm.client_count}
                    onChange={(e) => setCityForm({ ...cityForm, client_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Count
                  </label>
                  <input
                    type="number"
                    value={cityForm.session_count}
                    onChange={(e) => setCityForm({ ...cityForm, session_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Count
                  </label>
                  <input
                    type="number"
                    value={cityForm.review_count}
                    onChange={(e) => setCityForm({ ...cityForm, review_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={cityForm.whatsapp_number}
                  onChange={(e) => setCityForm({ ...cityForm, whatsapp_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  placeholder="e.g., +919876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Message Template
                </label>
                <textarea
                  value={cityForm.whatsapp_message}
                  onChange={(e) => setCityForm({ ...cityForm, whatsapp_message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent resize-none"
                  rows="2"
                  placeholder="e.g., Hi! I'm interested in yoga training in Mumbai."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={cityForm.display_order}
                  onChange={(e) => setCityForm({ ...cityForm, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="city-active"
                  checked={cityForm.is_active}
                  onChange={(e) => setCityForm({ ...cityForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#336b6e] border-gray-300 rounded focus:ring-[#336b6e]"
                />
                <label htmlFor="city-active" className="text-sm font-medium text-gray-700">
                  Active (visible on website)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#336b6e] text-white px-6 py-3 rounded-lg hover:bg-[#2a5557] transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingCity ? 'Update City' : 'Create City'}
                </button>
                <button
                  type="button"
                  onClick={closeCityModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationManagement
