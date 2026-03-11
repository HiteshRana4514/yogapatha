import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Award,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Users
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function AdminTeam() {
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    bio: '',
    image_url: '',
    email: '',
    phone: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    facebook_url: '',
    specialization: '',
    experience_years: 0,
    display_order: 0,
    is_featured: false,
    status: 'active'
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
      alert('Failed to fetch team members: ' + error.message)
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

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

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
        setFormData(prev => ({ ...prev, image_url: data.secure_url }))
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

    if (!formData.name || !formData.designation) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(formData)
          .eq('id', editingMember.id)

        if (error) throw error
        alert('Team member updated successfully!')
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([formData])

        if (error) throw error
        alert('Team member added successfully!')
      }

      fetchTeamMembers()
      closeModal()
    } catch (error) {
      console.error('Error saving team member:', error)
      alert('Failed to save team member: ' + error.message)
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      designation: member.designation,
      bio: member.bio || '',
      image_url: member.image_url || '',
      email: member.email || '',
      phone: member.phone || '',
      linkedin_url: member.linkedin_url || '',
      twitter_url: member.twitter_url || '',
      instagram_url: member.instagram_url || '',
      facebook_url: member.facebook_url || '',
      specialization: member.specialization || '',
      experience_years: member.experience_years || 0,
      display_order: member.display_order,
      is_featured: member.is_featured,
      status: member.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this team member?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Team member deleted successfully!')
      fetchTeamMembers()
    } catch (error) {
      console.error('Error deleting team member:', error)
      alert('Failed to delete team member: ' + error.message)
    }
  }

  const toggleStatus = async (member) => {
    try {
      const newStatus = member.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('team_members')
        .update({ status: newStatus })
        .eq('id', member.id)

      if (error) throw error
      fetchTeamMembers()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const updateDisplayOrder = async (id, newOrder) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ display_order: newOrder })
        .eq('id', id)

      if (error) throw error
      fetchTeamMembers()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMember(null)
    setFormData({
      name: '',
      designation: '',
      bio: '',
      image_url: '',
      email: '',
      phone: '',
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      facebook_url: '',
      specialization: '',
      experience_years: 0,
      display_order: 0,
      is_featured: false,
      status: 'active'
    })
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.specialization && member.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-4 md:p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#336b6e] mb-2">Our Team Management</h1>
          <p className="text-gray-600">Manage team members and their profiles</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* Team Members Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No team members found</h3>
            <p className="text-gray-500">Start by adding your first team member</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Card Header with Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#336b6e] to-[#2a5557]">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#bb9f58] flex items-center justify-center text-white font-bold text-4xl">
                        {member.name.charAt(0)}
                      </div>
                    </div>
                  )}
                  {member.is_featured && (
                    <div className="absolute top-3 right-3 bg-[#bb9f58] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-[#336b6e] mb-1">{member.name}</h3>
                  <p className="text-sm text-[#bb9f58] font-semibold mb-3">{member.designation}</p>

                  {member.specialization && (
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-semibold">Specialization:</span> {member.specialization}
                    </p>
                  )}

                  {member.experience_years > 0 && (
                    <p className="text-xs text-gray-600 mb-3">
                      <span className="font-semibold">Experience:</span> {member.experience_years} years
                    </p>
                  )}

                  {member.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{member.bio}</p>
                  )}

                  {/* Contact & Social */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="text-gray-500 hover:text-[#336b6e]" title="Email">
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="text-gray-500 hover:text-[#336b6e]" title="Phone">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#336b6e]" title="LinkedIn">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.twitter_url && (
                      <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#336b6e]" title="Twitter">
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {member.instagram_url && (
                      <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#336b6e]" title="Instagram">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {member.facebook_url && (
                      <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#336b6e]" title="Facebook">
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Status & Order */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {member.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Order: {member.display_order}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(member)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {member.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => updateDisplayOrder(member.id, member.display_order - 1)}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateDisplayOrder(member.id, member.display_order + 1)}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="px-3 py-2 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
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
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <button onClick={closeModal} className="text-white hover:text-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="Enter name"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="e.g., Senior Yoga Instructor"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover"
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

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                    placeholder="Brief bio about the team member..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="+91 1234567890"
                    />
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="e.g., Hatha Yoga, Meditation"
                    />
                  </div>

                  {/* Experience Years */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (Years)</label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter URL</label>
                      <input
                        type="url"
                        name="twitter_url"
                        value={formData.twitter_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        placeholder="https://twitter.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                      <input
                        type="url"
                        name="instagram_url"
                        value={formData.instagram_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook URL</label>
                      <input
                        type="url"
                        name="facebook_url"
                        value={formData.facebook_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
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
                    {editingMember ? 'Update' : 'Create'}
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

export default AdminTeam
