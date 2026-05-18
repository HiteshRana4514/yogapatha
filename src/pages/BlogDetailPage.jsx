import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabase/supabse';
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Loader2,
  Tag,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import SEO from '../components/SEO'

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (!loading && blog) {
      // Notify prerenderer that dynamic content is ready
      const timer = setTimeout(() => {
        window.prerenderReady = true;
        window.dispatchEvent(new Event('render-event'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, blog]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;

      if (data) {
        setBlog(data);
        // Increment view count
        await supabase
          .from('blogs')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);

        // Fetch related blogs
        fetchRelatedBlogs(data.tags, data.id);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (tags, currentBlogId) => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .neq('id', currentBlogId)
        .limit(3);

      if (error) throw error;
      setRelatedBlogs(data || []);
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#fdfcf3] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#336b6e]" size={40} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#fdfcf3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#336b6e] mb-4">Blog not found</h2>
          <button
            onClick={() => navigate('/blogs')}
            className="text-[#bb9f58] hover:underline"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={blog.meta_title || `${blog.title} | Yoga Blogs`}
        description={blog.meta_description || blog.description || blog.content.substring(0, 160).replace(/<[^>]*>/g, '')}
        keywords={blog.meta_keywords || (blog.tags ? blog.tags.join(', ') : 'yoga blog, wellness')}
        ogImage={blog.image_url}
        canonicalUrl={shareUrl}
        ogType="article"
        schemaData={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': blog.title,
          'image': blog.image_url,
          'author': {
            '@type': 'Person',
            'name': 'Admin'
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'YogaPatha',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://tislxmwwnvjyccvcqavu.supabase.co/storage/v1/object/public/images/footerLogo.jpg'
            }
          },
          'datePublished': blog.published_at,
          'description': blog.meta_description || blog.description || blog.content.substring(0, 160).replace(/<[^>]*>/g, '')
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-white to-[#fdfcf3]">
        {/* Hero Section */}
        <div className="relative">
          {blog.image_url ? (
            <div className="relative h-[60vh] overflow-hidden">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#336b6e] via-[#336b6e]/50 to-transparent"></div>

              {/* Back Button */}
              <button
                onClick={() => navigate('/blogs')}
                className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-[#336b6e] p-3 rounded-full hover:bg-white transition shadow-lg"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Share Button */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="bg-white/90 backdrop-blur-sm text-[#336b6e] p-3 rounded-full hover:bg-white transition shadow-lg"
                >
                  <Share2 size={20} />
                </button>

                {/* Share Menu */}
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-2xl p-4 w-64 z-10">
                    <h3 className="text-sm font-semibold text-[#336b6e] mb-3">Share this blog</h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleShareFacebook}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#336b6e]/10 transition text-[#336b6e]"
                      >
                        <Facebook size={18} />
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={handleShareTwitter}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#336b6e]/10 transition text-[#336b6e]"
                      >
                        <Twitter size={18} />
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={handleShareLinkedIn}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#336b6e]/10 transition text-[#336b6e]"
                      >
                        <Linkedin size={18} />
                        <span>LinkedIn</span>
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#336b6e]/10 transition text-[#336b6e]"
                      >
                        <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#336b6e]/10 transition text-[#336b6e]"
                      >
                        {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="container mx-auto max-w-4xl">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    {blog.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(blog.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      Admin
                    </span>
                    <span className="px-3 py-1 bg-[#bb9f58] text-[#336b6e] rounded-full text-sm font-semibold">
                      {blog.language === 'hindi' ? 'हिंदी' : 'English'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] py-16 relative">
              <button
                onClick={() => navigate('/blogs')}
                className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-[#336b6e] p-3 rounded-full hover:bg-white transition shadow-lg"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {blog.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(blog.published_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <User size={16} />
                    Admin
                  </span>
                  <span className="px-3 py-1 bg-[#bb9f58] text-[#336b6e] rounded-full text-sm font-semibold">
                    {blog.language === 'hindi' ? 'हिंदी' : 'English'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-[#336b6e]/10 text-[#336b6e] rounded-full text-sm"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Blog Content */}
          <div
            className="prose prose-lg max-w-none
            prose-headings:text-[#336b6e] 
            prose-p:text-[#336b6e] prose-p:opacity-80
            prose-a:text-[#bb9f58] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#336b6e]
            prose-ul:text-[#336b6e] prose-ol:text-[#336b6e]
            prose-blockquote:border-l-[#bb9f58] prose-blockquote:text-[#336b6e]
            prose-code:text-[#336b6e] prose-code:bg-[#fdfcf3]
            prose-pre:bg-[#336b6e] prose-pre:text-white
            prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-[#336b6e]/20">
            <h3 className="text-xl font-bold text-[#336b6e] mb-4">Share this article</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShareFacebook}
                className="flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition"
              >
                <Facebook size={18} />
                Facebook
              </button>
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition"
              >
                <Twitter size={18} />
                Twitter
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition"
              >
                <Linkedin size={18} />
                LinkedIn
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition"
              >
                {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="bg-[#fdfcf3] py-12">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold text-[#336b6e] mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <div
                    key={relatedBlog.id}
                    onClick={() => {
                      navigate(`/blogs/${relatedBlog.slug}`);
                      window.scrollTo(0, 0);
                    }}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer group"
                  >
                    {relatedBlog.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={relatedBlog.image_url}
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-[#336b6e] mb-2 line-clamp-2 group-hover:text-[#2a5557] transition">
                        {relatedBlog.title}
                      </h3>
                      <p className="text-sm text-[#336b6e] opacity-60">
                        {new Date(relatedBlog.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BlogDetailPage;
