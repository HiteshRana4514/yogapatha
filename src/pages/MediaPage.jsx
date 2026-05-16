import { useState, useEffect } from 'react';
import  supabase  from '../supabase/supabse';
import { Image, Video, Loader2, Play } from 'lucide-react';
import SEO from '../components/SEO';

const MediaPage = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filter, setFilter] = useState('all'); // all, image, video

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = filter === 'all' 
    ? media 
    : media.filter(item => item.media_type === filter);

  const openLightbox = (item) => {
    setSelectedMedia(item);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <SEO
        title="Media Gallery | YogaPatha Community"
        description="Explore our media gallery featuring yoga sessions, wellness workshops, and community events at YogaPatha."
        keywords="yoga gallery, yoga videos, yoga images, wellness workshops, YogaPatha events"
      />
      <div className="min-h-screen bg-gradient-to-br from-white to-[#fdfcf3]">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] text-white py-16 relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-24 h-24 bg-[#bb9f58] opacity-10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 left-16 w-32 h-32 bg-[#bb9f58] opacity-10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Media Gallery
            </h1>
            <p className="text-center text-lg text-[#fdfcf3] opacity-90 max-w-2xl mx-auto">
              Explore our collection of yoga sessions, workshops, and community moments
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-[#fdfcf3] border-b border-[#336b6e]/10 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-4 py-4 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-[#336b6e] text-[#bb9f58] shadow-lg'
                    : 'bg-white text-[#336b6e] hover:bg-[#336b6e]/10 border border-[#336b6e]/20'
                }`}
              >
                All ({media.length})
              </button>
              <button
                onClick={() => setFilter('image')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  filter === 'image'
                    ? 'bg-[#336b6e] text-[#bb9f58] shadow-lg'
                    : 'bg-white text-[#336b6e] hover:bg-[#336b6e]/10 border border-[#336b6e]/20'
                }`}
              >
                <Image size={16} />
                Images ({media.filter(m => m.media_type === 'image').length})
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  filter === 'video'
                    ? 'bg-[#336b6e] text-[#bb9f58] shadow-lg'
                    : 'bg-white text-[#336b6e] hover:bg-[#336b6e]/10 border border-[#336b6e]/20'
                }`}
              >
                <Video size={16} />
                Videos ({media.filter(m => m.media_type === 'video').length})
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-[#336b6e]" size={48} />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-[#336b6e] opacity-30 mb-4">
                {filter === 'all' ? <Image size={64} className="mx-auto" /> : 
                 filter === 'image' ? <Image size={64} className="mx-auto" /> :
                 <Video size={64} className="mx-auto" />}
              </div>
              <h3 className="text-xl font-semibold text-[#336b6e] mb-2">
                No {filter === 'all' ? 'media' : filter + 's'} found
              </h3>
              <p className="text-[#336b6e] opacity-60">Check back later for new content</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openLightbox(item)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                >
                  {/* Media Preview */}
                  <div className="relative h-64 bg-[#fdfcf3] overflow-hidden">
                    {item.media_type === 'image' ? (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-black">
                        <video
                          key={item.media_url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        >
                          <source src={item.media_url} type="video/mp4" />
                          <source src={item.media_url} type="video/webm" />
                          <source src={item.media_url} />
                        </video>
                        <div className="absolute inset-0 bg-[#336b6e] bg-opacity-30 flex items-center justify-center pointer-events-none">
                          <div className="bg-[#bb9f58] bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform">
                            <Play size={32} className="text-[#336b6e]" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-3 right-3 bg-[#336b6e] bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      {item.media_type === 'image' ? (
                        <Image size={14} className="text-[#bb9f58]" />
                      ) : (
                        <Video size={14} className="text-[#bb9f58]" />
                      )}
                    </div>
                  </div>

                  {/* Media Info */}
                  <div className="p-4 bg-gradient-to-br from-white to-[#fdfcf3]">
                    <h3 className="font-semibold text-[#336b6e] mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[#336b6e] opacity-70 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {selectedMedia && (
          <div
            className="fixed inset-0 bg-[#336b6e] bg-opacity-95 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-[#bb9f58] hover:text-[#fdfcf3] transition z-10 bg-[#336b6e] rounded-full p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
              {/* Media Display */}
              <div className="mb-4">
                {selectedMedia.media_type === 'image' ? (
                  <img
                    src={selectedMedia.media_url}
                    alt={selectedMedia.title}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  />
                ) : (
                  <video
                    src={selectedMedia.media_url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[80vh] rounded-2xl shadow-2xl"
                  />
                )}
              </div>

              {/* Media Info */}
              <div className="bg-gradient-to-br from-[#fdfcf3] to-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  {selectedMedia.media_type === 'image' ? (
                    <Image size={24} className="text-[#336b6e] mt-1" />
                  ) : (
                    <Video size={24} className="text-[#336b6e] mt-1" />
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#336b6e] mb-2">
                      {selectedMedia.title}
                    </h2>
                    {selectedMedia.description && (
                      <p className="text-[#336b6e] opacity-80">{selectedMedia.description}</p>
                    )}
                    <p className="text-sm text-[#bb9f58] mt-2 font-medium">
                      {new Date(selectedMedia.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MediaPage;
