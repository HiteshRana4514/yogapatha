import { useEffect } from 'react'

function SEO({ 
  title, 
  description, 
  keywords = '', 
  ogImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  ogType = 'website',
  canonicalUrl = ''
}) {
  useEffect(() => {
    // Set document title
    document.title = title

    // Helper function to set or update meta tags
    const setMetaTag = (name, content, isProperty = false) => {
      if (!content) return

      const attribute = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      
      element.setAttribute('content', content)
    }

    // Set standard meta tags
    setMetaTag('description', description)
    if (keywords) {
      setMetaTag('keywords', keywords)
    }

    // Set Open Graph tags
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:type', ogType, true)
    setMetaTag('og:image', ogImage, true)
    
    if (canonicalUrl) {
      setMetaTag('og:url', canonicalUrl, true)
      
      // Set canonical link
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', canonicalUrl)
    }

    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', ogImage)

    // Set additional SEO tags
    setMetaTag('robots', 'index, follow')
    setMetaTag('author', 'YogaPatha')
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0')

  }, [title, description, keywords, ogImage, ogType, canonicalUrl])

  return null // This component doesn't render anything
}

export default SEO
