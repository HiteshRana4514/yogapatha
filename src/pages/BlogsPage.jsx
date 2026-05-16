import { useState, useEffect } from 'react';
import supabase from '../supabase/supabse';
import { Calendar, User, ArrowRight, Loader2, BookOpen, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO'

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    const strippedText = text.replace(/<[^>]*>/g, '');
    if (strippedText.length <= maxLength) return strippedText;
    return strippedText.substring(0, maxLength) + '...';
  };

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLanguage = selectedLanguage === 'all' || blog.language === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });

  return (
    <>
      <SEO
        title="Yoga Blogs | Wellness & Healthy Living Tips - YogaPatha"
        description="Explore our collection of blogs on yoga, meditation, wellness, and healthy living. Read expert tips and insights for a balanced lifestyle."
        keywords="yoga blogs, wellness tips, meditation guide, healthy living, yoga insights"
        canonicalUrl="https://www.yogapatha.in/blogs"
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
              Our Blogs
            </h1>
            <p className="text-center text-lg text-[#fdfcf3] opacity-90 max-w-2xl mx-auto">
              Explore articles about yoga, wellness, meditation, and healthy living
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-[#fdfcf3] border-b border-[#336b6e]/10 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#336b6e] opacity-50" size={20} />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                />
              </div>

              {/* Language Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={20} className="text-[#336b6e]" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                >
                  <option value="all">All Languages</option>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-[#336b6e] opacity-70">
                {filteredBlogs.length} {filteredBlogs.length === 1 ? 'blog' : 'blogs'} found
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-[#336b6e]" size={40} />
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto text-[#336b6e] opacity-30 mb-4" />
              <h3 className="text-xl font-semibold text-[#336b6e] mb-2">
                No blogs found
              </h3>
              <p className="text-[#336b6e] opacity-60">
                {searchTerm || selectedLanguage !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new content'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => (
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
                      {blog.is_featured && (
                        <div className="absolute top-3 right-3 bg-[#bb9f58] text-[#336b6e] px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                          Featured
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-[#336b6e]/80 backdrop-blur-sm text-[#bb9f58] px-3 py-1 rounded-full text-xs font-semibold">
                        {blog.language === 'hindi' ? 'हिंदी' : 'English'}
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-[#336b6e] to-[#2a5557] flex items-center justify-center relative">
                      <BookOpen size={64} className="text-[#bb9f58] opacity-50" />
                      {blog.is_featured && (
                        <div className="absolute top-3 right-3 bg-[#bb9f58] text-[#336b6e] px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                          Featured
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-[#336b6e]/80 backdrop-blur-sm text-[#bb9f58] px-3 py-1 rounded-full text-xs font-semibold">
                        {blog.language === 'hindi' ? 'हिंदी' : 'English'}
                      </div>
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
                        {blog.tags.length > 3 && (
                          <span className="px-2 py-1 bg-[#336b6e]/10 text-[#336b6e] text-xs rounded-full">
                            +{blog.tags.length - 3} more
                          </span>
                        )}
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
          )}
        </div>
      </div>
    </>
  );
};

export default BlogsPage;
