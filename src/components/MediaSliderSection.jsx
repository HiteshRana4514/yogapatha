import { useState, useEffect, useContext } from 'react';
import supabase  from '../supabase/supabse';
import { ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingContext } from '../pages/LandingPage';

const MediaSliderSection = () => {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loadingContext = useContext(LoadingContext);

  useEffect(() => {
    fetchLandingMedia();
  }, []);

  const fetchLandingMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('show_on_landing', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
      // Notify parent that media has loaded
      if (loadingContext?.updateLoadingState) {
        loadingContext.updateLoadingState('media', false);
      }
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play slider
  useEffect(() => {
    if (media.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [media.length, currentIndex]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (media.length === 0) {
    return null; // Don't show section if no media
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-white to-[#fdfcf3] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-24 h-24 bg-[#336b6e] opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-32 h-32 bg-[#bb9f58] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#336b6e] mb-4">
            Our Gallery
          </h2>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-2xl mx-auto leading-relaxed">
            Explore moments from our yoga sessions, workshops, and community events
          </p>
        </div>

        {/* Main Slider */}
        <div className="relative max-w-6xl mx-auto">
          {/* Slider Container */}
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-[#336b6e]">
            {/* Current Slide */}
            {media.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {item.media_type === 'image' ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  ) : (
                  <div className="relative w-full h-full bg-black">
                    <video
                      key={item.media_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="auto"
                    >
                      <source src={item.media_url} type="video/mp4" />
                      <source src={item.media_url} type="video/webm" />
                      <source src={item.media_url} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Overlay with Title */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#336b6e] via-[#336b6e]/70 to-transparent p-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#bb9f58] mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[#fdfcf3] text-lg max-w-2xl">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#336b6e]/20 hover:bg-[#336b6e]/40 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#336b6e]/20 hover:bg-[#336b6e]/40 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                  aria-label="Next slide"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Dots Navigation */}
          {media.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-[#bb9f58]'
                      : 'w-2 bg-[#336b6e]/30 hover:bg-[#336b6e]/50'
                  } h-2 rounded-full`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        {media.length > 1 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goToSlide(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-4 ring-[#bb9f58] scale-105'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        src={item.media_url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#336b6e] bg-opacity-30 flex items-center justify-center">
                        <Play size={16} className="text-[#bb9f58]" fill="currentColor" />
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/media')}
            className="inline-flex items-center gap-2 bg-[#336b6e] hover:bg-[#2a5557] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Media
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MediaSliderSection;
