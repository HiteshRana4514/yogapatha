import { useState, useEffect, useRef } from "react";
import supabase from "../../src/supabase/supabse";
import { marked } from "marked";
import {
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Star,
  StarOff,
  Globe,
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sonar");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    language: "english",
    tags: "",
    image: null,
    published: false,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env
    .VITE_CLOUDINARY_UPLOAD_PRESET;

  const editorRef = useRef(null);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setFormData({ ...formData, content: editorRef.current.innerHTML });
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "yogapatha/blogs");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("Failed to upload image");
    return await response.json();
  };

  const handleGeneratePost = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a title first");
      return;
    }

    setGenerating(true);
    const url = `${import.meta.env.VITE_PROJECT_URL}/functions/v1/generate-blog`;
    const topic = `${formData.title}`;
    const language = formData.language;
    // const model = "sonar";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        },
        body: JSON.stringify({ topic, language, selectedModel }),
      });

      if (!response.ok) throw new Error("Failed to generate post");
      const data = await response.json();

      // Check if blogContent exists
      if (!data.blogContent) {
        throw new Error("No blog content received from API");
      }

      // Clean up the content - remove code block wrappers if present
      const cleanBlog = data.blogContent.replace(/\[\d+\]/g, "");
      let cleanContent = cleanBlog;

      // Remove <pre><code class="language-markdown"> wrapper if present
      if (cleanContent.includes('<pre><code class="language-markdown">')) {
        cleanContent = cleanContent
          .replace(/<pre><code class="language-markdown">/g, '')
          .replace(/<\/code><\/pre>/g, '')
          .trim();
      }

      // Remove markdown code fences if present
      if (cleanContent.startsWith('```markdown')) {
        cleanContent = cleanContent
          .replace(/^```markdown\n/, '')
          .replace(/\n```$/, '')
          .trim();
      }


      // Configure marked options for better formatting
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
      });

      // Convert markdown to HTML - handle both sync and async
      const parseResult = marked.parse(cleanContent);
      const htmlContent = parseResult instanceof Promise ? await parseResult : parseResult;


      // Update the editor content first
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent;
      } else {
        console.error("❌ editorRef.current is null!");
      }

      // Then update the form state
      setFormData({ ...formData, content: htmlContent });
    } catch (error) {
      console.error("Error generating post:", error);
      alert("Failed to generate post: " + error.message);
    }
    finally {
      setGenerating(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = editingBlog?.image_url || null;
      let cloudinaryPublicId = editingBlog?.cloudinary_public_id || null;

      // Upload new image if provided
      if (formData.image) {
        const uploadResult = await uploadToCloudinary(formData.image);
        imageUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
      }

      const slug = generateSlug(formData.title);
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const blogData = {
        title: formData.title,
        slug: slug,
        description: formData.description,
        content: formData.content,
        language: formData.language,
        tags: tagsArray,
        image_url: imageUrl,
        cloudinary_public_id: cloudinaryPublicId,
        published: formData.published,
        is_featured: formData.is_featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
        author_id: user.id,
        author_name: user.email,
        published_at: formData.published ? new Date().toISOString() : null,
      };

      if (editingBlog) {
        // Update existing blog
        const { error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", editingBlog.id);

        if (error) throw error;
        alert("Blog updated successfully!");
      } else {
        // Create new blog
        const { error } = await supabase.from("blogs").insert([blogData]);

        if (error) throw error;
        alert("Blog created successfully!");
      }

      handleCloseModal();
      fetchBlogs();
    } catch (error) {
      console.error("Error saving blog:", error);
      alert("Failed to save blog: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (blog) => {

    // Clean up the content if it has code block wrappers
    let cleanContent = blog.content;

    // Remove <pre><code class="language-markdown"> wrapper if present
    if (cleanContent.includes('<pre><code class="language-markdown">')) {
      cleanContent = cleanContent
        .replace(/<pre><code class="language-markdown">/g, '')
        .replace(/<\/code><\/pre>/g, '')
        .trim();

      // Convert markdown to HTML
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
      });

      const parseResult = marked.parse(cleanContent);
      cleanContent = parseResult instanceof Promise ? parseResult : parseResult;
    }

    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      description: blog.description || "",
      content: cleanContent,
      language: blog.language,
      tags: blog.tags ? blog.tags.join(", ") : "",
      image: null,
      published: blog.published,
      is_featured: blog.is_featured,
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
      meta_keywords: blog.meta_keywords || "",
    });
    setPreviewImage(blog.image_url);
    setShowModal(true);
    // Set editor content after modal opens
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = cleanContent;
      }
    }, 100);
  };

  const handleDelete = async (id, cloudinaryPublicId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      // Delete from Cloudinary if image exists
      if (cloudinaryPublicId) {
        // Note: Cloudinary deletion requires signed requests
        // For now, we'll just delete from database
        // You can implement server-side deletion later
      }

      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) throw error;
      alert("Blog deleted successfully!");
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    }
  };

  const togglePublished = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .update({
          published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
      fetchBlogs();
    } catch (error) {
      console.error("Error toggling published status:", error);
      alert("Failed to update status");
    }
  };

  const toggleFeatured = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("blogs")
        .update({ is_featured: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchBlogs();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      alert("Failed to update status");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBlog(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      language: "english",
      tags: "",
      image: null,
      published: false,
      is_featured: false,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
    });
    setPreviewImage(null);
    if (previewImage && !editingBlog) {
      URL.revokeObjectURL(previewImage);
    }
  };

  const featuredCount = blogs.filter((b) => b.is_featured).length;

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#336b6e]">Blog Management</h1>
          <p className="text-[#336b6e] opacity-70 mt-1">
            Manage your blog posts. {blogs.filter((b) => b.published).length}{" "}
            published, {featuredCount} featured.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#336b6e] text-[#bb9f58] px-4 py-2 rounded-lg hover:bg-[#2a5557] transition-all shadow-md hover:shadow-lg"
        >
          <Upload size={20} />
          Create Blog
        </button>
      </div>

      {/* Blogs Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[#336b6e]" size={40} />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <ImageIcon
            size={48}
            className="mx-auto text-[#336b6e] opacity-30 mb-4"
          />
          <p className="text-[#336b6e] opacity-70">No blogs created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Blog Image */}
              {blog.image_url && (
                <div className="relative h-48 bg-[#fdfcf3]">
                  <img
                    src={blog.image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                  {blog.is_featured && (
                    <div className="absolute top-2 right-2 bg-[#bb9f58] text-[#336b6e] px-2 py-1 rounded text-xs font-semibold shadow-md">
                      Featured
                    </div>
                  )}
                  {!blog.published && (
                    <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
                      Draft
                    </div>
                  )}
                </div>
              )}

              {/* Blog Info */}
              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Globe
                    size={16}
                    className="text-[#336b6e] mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#336b6e] line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.description && (
                      <p className="text-sm text-[#336b6e] opacity-70 mt-1 line-clamp-2">
                        {blog.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-2 text-xs text-[#336b6e] opacity-60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(blog.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe size={12} />
                    {blog.language}
                  </span>
                  {blog.tags && blog.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {blog.tags.length} tags
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => togglePublished(blog.id, blog.published)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${blog.published
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20"
                      }`}
                  >
                    {blog.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {blog.published ? "Published" : "Draft"}
                  </button>

                  <button
                    onClick={() => toggleFeatured(blog.id, blog.is_featured)}
                    className={`p-1.5 rounded transition ${blog.is_featured
                        ? "bg-[#bb9f58] text-[#336b6e] hover:bg-[#a08a4a]"
                        : "bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20"
                      }`}
                    title={
                      blog.is_featured
                        ? "Remove from featured"
                        : "Mark as featured"
                    }
                  >
                    {blog.is_featured ? (
                      <Star size={14} fill="currentColor" />
                    ) : (
                      <StarOff size={14} />
                    )}
                  </button>

                  <button
                    onClick={() => handleEdit(blog)}
                    className="p-1.5 rounded bg-[#336b6e]/10 text-[#336b6e] hover:bg-[#336b6e]/20 transition"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(blog.id, blog.cloudinary_public_id)
                    }
                    className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition ml-auto"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold">
                {editingBlog ? "Edit Blog" : "Create New Blog"}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={uploading}
                className="text-white hover:text-[#bb9f58] transition disabled:opacity-50"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                    placeholder="Enter blog title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Short Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                    placeholder="Brief summary (optional)"
                    rows="2"
                  />
                </div>

                {/* Language & Tags Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-1">
                      Language *
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                    >
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                      placeholder="yoga, meditation, health (comma separated)"
                    />
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Featured Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                  />
                  {previewImage && (
                    <div className="mt-3 border-2 border-[#336b6e]/20 rounded-lg p-4 bg-[#fdfcf3]">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-1">
                    Content *
                  </label>

                  {/* Toolbar */}
                  <div className="border border-[#336b6e]/30 rounded-t-lg bg-[#fdfcf3] p-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => execCommand("bold")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Bold"
                    >
                      <Bold size={18} className="text-[#336b6e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand("italic")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Italic"
                    >
                      <Italic size={18} className="text-[#336b6e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand("underline")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Underline"
                    >
                      <Underline size={18} className="text-[#336b6e]" />
                    </button>
                    <div className="w-px h-8 bg-[#336b6e]/20 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => execCommand("insertUnorderedList")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Bullet List"
                    >
                      <List size={18} className="text-[#336b6e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand("insertOrderedList")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Numbered List"
                    >
                      <span className="text-[#336b6e] font-bold">1.</span>
                    </button>
                    <div className="w-px h-8 bg-[#336b6e]/20 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => execCommand("justifyLeft")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Align Left"
                    >
                      <AlignLeft size={18} className="text-[#336b6e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand("justifyCenter")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Align Center"
                    >
                      <AlignCenter size={18} className="text-[#336b6e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand("justifyRight")}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Align Right"
                    >
                      <AlignRight size={18} className="text-[#336b6e]" />
                    </button>
                    <div className="w-px h-8 bg-[#336b6e]/20 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter URL:");
                        if (url) execCommand("createLink", url);
                      }}
                      className="p-2 hover:bg-[#336b6e]/10 rounded"
                      title="Insert Link"
                    >
                      <LinkIcon size={18} className="text-[#336b6e]" />
                    </button>
                    <select
                      onChange={(e) =>
                        execCommand("formatBlock", e.target.value)
                      }
                      className="px-2 py-1 border border-[#336b6e]/30 rounded text-sm text-[#336b6e]"
                      defaultValue=""
                    >
                      <option value="">Normal</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="h4">Heading 4</option>
                      <option value="p">Paragraph</option>
                    </select>
                    <select
                      onChange={(e) => {
                        setSelectedModel(e.target.value)
                      }}
                      className="px-2 py-1 border border-[#336b6e]/30 rounded text-sm text-[#336b6e] ml-auto"
                      defaultValue="sonar"
                    >
                      <option value="sonar">Sonar</option>
                      <option value="sonar pro">Sonar Pro</option>
                      <option value="Sonar Reasoning">Sonar Reasoning</option>
                      <option value="Sonar Reasoning Pro">Sonar Reasoning Pro</option>
                      <option value="Sonar Deep Research">Sonar Deep Research</option>
                    </select>
                  </div>

                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    className="border border-t-0 border-[#336b6e]/30 rounded-b-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-white focus:outline-none focus:ring-2 focus:ring-[#bb9f58] prose prose-sm max-w-none"
                    style={{
                      lineHeight: "1.6",
                      fontSize: "16px",
                    }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-[#336b6e] opacity-60 mt-1">
                      Use the toolbar above to format your content
                    </p>
                    <button
                      type="button"
                      onClick={handleGeneratePost}
                      disabled={generating || !formData.title.trim()}
                      className="flex px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Generating...
                        </>
                      ) : (
                        "Generate Post"
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          published: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#336b6e] border-[#336b6e]/30 rounded focus:ring-[#bb9f58]"
                    />
                    <span className="text-sm text-[#336b6e]">
                      Publish immediately
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#336b6e] border-[#336b6e]/30 rounded focus:ring-[#bb9f58]"
                    />
                    <span className="text-sm text-[#336b6e]">
                      Mark as featured
                    </span>
                  </label>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="pt-6 border-t border-gray-200 mt-6">
                <h3 className="text-lg font-bold text-[#336b6e] mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">Meta Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="SEO Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">Meta Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows="2"
                      placeholder="SEO Description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">Meta Keywords</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#336b6e]/30 rounded-lg focus:ring-2 focus:ring-[#bb9f58] focus:border-transparent"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      placeholder="e.g., yoga, meditation, health (comma separated)"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[#336b6e]/10">
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
                      {editingBlog ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {editingBlog ? "Update Blog" : "Create Blog"}
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

export default BlogManagement;
