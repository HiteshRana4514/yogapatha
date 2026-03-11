import { useState, useEffect } from 'react';
import supabase from '../../src/supabase/supabse';
import { Upload, Image, Video, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

const MediaManagement = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  // Cloudinary configuration - Replace with your actual credentials
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
      alert('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const resourceType = file.type.startsWith('video') ? 'video' : 'image';
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);

      // Upload to Cloudinary
      const { url, publicId } = await uploadToCloudinary(formData.file);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save to database
      const { error } = await supabase
        .from('media')
        .insert({
          title: formData.title,
          description: formData.description,
          media_url: url,
          media_type: formData.mediaType,
          cloudinary_public_id: publicId,
          uploaded_by: user?.id,
          show_on_landing: false,
          display_order: 0
        });

      if (error) throw error;

      alert('Media uploaded successfully!');
      setShowUploadModal(false);
      setFormData({ title: '', description: '', mediaType: 'image', file: null });
      setPreviewUrl(null);
      fetchMedia();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCloseModal = () => {
    if (!uploading) {
      setShowUploadModal(false);
      setFormData({ title: '', description: '', mediaType: 'image', file: null });
      setPreviewUrl(null);
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const toggleLandingPage = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({ show_on_landing: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchMedia();
    } catch (error) {
      console.error('Error toggling landing page status:', error);
      alert('Failed to update status');
    }
  };

  const updateDisplayOrder = async (id, direction) => {
    const currentIndex = media.findIndex(m => m.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= media.length) return;

    const updatedMedia = [...media];
    [updatedMedia[currentIndex], updatedMedia[newIndex]] = [updatedMedia[newIndex], updatedMedia[currentIndex]];

    try {
      // Update display orders in database
      const updates = updatedMedia.map((item, index) => 
        supabase
          .from('media')
          .update({ display_order: index })
          .eq('id', item.id)
      );

      await Promise.all(updates);
      fetchMedia();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const deleteMedia = async (id, publicId) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Note: Cloudinary deletion requires server-side implementation with API secret
      // For now, we'll just remove from database
      // You should implement a backend endpoint to delete from Cloudinary using publicId

      alert('Media deleted successfully!');
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const landingPageCount = media.filter(m => m.show_on_landing).length;

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#336b6e]">Media Management</h1>
          <p className="text-[#336b6e] opacity-70 mt-1">
            Manage gallery images and videos. {landingPageCount} of 8 shown on landing page.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-[#336b6e] text-[#bb9f58] px-4 py-2 rounded-lg hover:bg-[#2a5557] transition-all shadow-md hover:shadow-lg"
        >
          <Upload size={20} />
          Upload Media
        </button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#336b6e]" size={40} />
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Image size={48} className="mx-auto text-[#336b6e] opacity-30 mb-4" />
          <p className="text-[#336b6e] opacity-70">No media uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              {/* Media Preview */}
              <div className="relative h-48 bg-[#fdfcf3]">
                {item.media_type === 'image' ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                {item.show_on_landing && (
                  <div className="absolute top-2 right-2 bg-[#bb9f58] text-[#336b6e] px-2 py-1 rounded text-xs font-semibold shadow-md">
                    On Landing
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  {item.media_type === 'image' ? (
                    <Image size={16} className="text-[#336b6e] mt-1" />
                  ) : (
                    <Video size={16} className="text-[#336b6e] mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#336b6e]">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-[#336b6e] opacity-70 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => toggleLandingPage(item.id, item.show_on_landing)}
                    disabled={!item.show_on_landing && landingPageCount >= 8}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${
                      item.show_on_landing
                        ? 'bg-[#bb9f58] text-[#336b6e] hover:bg-[#a08a4a]'
                        : landingPageCount >= 8
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20'
                    }`}
                    title={!item.show_on_landing && landingPageCount >= 8 ? 'Maximum 8 items allowed on landing page' : ''}
                  >
                    {item.show_on_landing ? <EyeOff size={14} /> : <Eye size={14} />}
                    {item.show_on_landing ? 'Hide' : 'Show'}
                  </button>

                  <button
                    onClick={() => updateDisplayOrder(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    onClick={() => updateDisplayOrder(item.id, 'down')}
                    disabled={index === media.length - 1}
                    className="p-1.5 rounded bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    onClick={() => deleteMedia(item.id, item.cloudinary_public_id)}
                    className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 ml-auto"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold">Upload Media</h2>
              <button
                onClick={handleCloseModal}
                disabled={uploading}
                className="text-white hover:text-[#bb9f58] transition disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                    placeholder="Enter media title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                    placeholder="Enter description (optional)"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Media Type *
                  </label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    File *
                  </label>
                  <input
                    type="file"
                    required
                    accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                  />
                  <p className="text-xs text-[#336b6e] opacity-60 mt-1">
                    {formData.mediaType === 'image' ? 'Supported: JPG, PNG, GIF' : 'Supported: MP4, MOV, AVI'}
                  </p>
                </div>

                {/* Preview Section */}
                {previewUrl && (
                  <div className="border-2 border-[#336b6e]/20 rounded-lg p-4 bg-[#fdfcf3]">
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Preview
                    </label>
                    {formData.mediaType === 'image' ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain rounded-lg bg-white"
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full h-64 rounded-lg bg-black"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-[#336b6e]/30 text-[#336b6e] rounded-lg hover:bg-[#336b6e]/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManagement;
