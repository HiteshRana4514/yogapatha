import { useState, useEffect, useContext } from 'react';
import supabase from '../supabase/supabse';
import { Calendar, User, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingContext } from '../pages/LandingPage';

const FeaturedBlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loadingContext = useContext(LoadingContext);

  useEffect(() => {
    fetchFeaturedBlogs();
  }, []);

  const fetchFeaturedBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching featured blogs:', error);
    } finally {
      setLoading(false);
      // Notify parent that blogs have loaded
      if (loadingContext?.updateLoadingState) {
        loadingContext.updateLoadingState('blogs', false);
      }
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    const strippedText = text.replace(/<[^>]*>/g, '');
    if (strippedText.length <= maxLength) return strippedText;
    return strippedText.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-br from-white to-[#fdfcf3] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-[#336b6e]" size={40} />
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) {
    return null; // Don't show section if no featured blogs
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
            Featured Blogs
          </h2>
          <p className="text-lg md:text-xl text-[#336b6e] opacity-80 max-w-2xl mx-auto leading-relaxed">
            Discover insights, tips, and stories about yoga, wellness, and mindful living
          </p>
        </div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              onClick={() => navigate(`/blogs/${blog.slug}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group"
            >
              {/* Blog Image */}
              {blog.image_url ? (
                <div className="relative h-56 overflow-hidden bg-[#fdfcf3]">
                  <img
                    src={blog.image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#336b6e]/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 bg-[#bb9f58] text-[#336b6e] px-3 py-1 rounded-full text-xs font-semibold">
                    Featured
                  </div>
                </div>
              ) : (
                <div className="h-56 bg-gradient-to-br from-[#336b6e] to-[#2a5557] flex items-center justify-center">
                  <BookOpen size={64} className="text-[#bb9f58] opacity-50" />
                </div>
              )}

              {/* Blog Content */}
              <div className="p-6">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-[#336b6e] opacity-60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(blog.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    Admin
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#336b6e] mb-2 line-clamp-2 group-hover:text-[#2a5557] transition-colors">
                  {blog.title}
                </h3>

                {/* Description */}
                <p className="text-[#336b6e] opacity-70 text-sm mb-4 line-clamp-3">
                  {blog.description || truncateText(blog.content, 120)}
                </p>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#336b6e]/10 text-[#336b6e] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Read More */}
                <button className="flex items-center gap-2 text-[#bb9f58] font-semibold text-sm group-hover:gap-3 transition-all">
                  Read More
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/blogs')}
            className="inline-flex items-center gap-2 bg-[#336b6e] hover:bg-[#2a5557] text-[#bb9f58] px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Blogs
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBlogSection;
