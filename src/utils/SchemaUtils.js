/**
 * Schema utility to generate JSON-LD for different types of structured data.
 */

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'YogaPatha',
  'url': 'https://www.yogapatha.in/',
  'logo': 'https://www.yogapatha.in/favicon2.png',
  'description': 'PAN India platform connecting clients with certified yoga trainers for personal needs like weight loss, stress management, and prenatal yoga.',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'IN',
  },
  'sameAs': [
    'https://www.facebook.com/yogapatha',
    'https://www.instagram.com/yogapatha',
    'https://twitter.com/yogapatha',
  ],
});

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'YogaPatha',
  'url': 'https://www.yogapatha.in/',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': 'https://www.yogapatha.in/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
});

export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'HealthAndBeautyBusiness',
  'name': 'YogaPatha',
  'image': 'https://www.yogapatha.in/favicon2.png',
  '@id': 'https://www.yogapatha.in/',
  'url': 'https://www.yogapatha.in/',
  'telephone': '+918529897856',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': '60, Rattan Singh Chowk, trillium road, opposite adarsh hospital, firstfloor',
    'addressLocality': 'Amritsar',
    'addressRegion': 'Punjab',
    'postalCode': '143001',
    'addressCountry': 'IN',
  },
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 31.6340,
    'longitude': 74.8723,
  },
  'openingHoursSpecification': {
    '@type': 'OpeningHoursSpecification',
    'dayOfWeek': [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    'opens': '06:00',
    'closes': '22:00',
  },
});

export const getProductSchema = (service) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  'name': service.title,
  'description': service.description,
  'provider': {
    '@type': 'Organization',
    'name': 'YogaPatha',
    'logo': 'https://www.yogapatha.in/logo.png'
  },
});

export const getBlogSchema = (blog) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  'headline': blog.title,
  'image': blog.image_url || 'https://www.yogapatha.in/logo.png',
  'author': {
    '@type': 'Person',
    'name': 'YogaPatha Expert'
  },
  'publisher': {
    '@type': 'Organization',
    'name': 'YogaPatha',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://www.yogapatha.in/logo.png'
    }
  },
  'datePublished': blog.published_at || blog.created_at,
  'description': blog.description || blog.content?.substring(0, 160).replace(/<[^>]*>/g, '')
});

export const getCourseSchema = (course) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  'name': course.title,
  'description': course.description,
  'provider': {
    '@type': 'Organization',
    'name': 'YogaPatha',
    'sameAs': 'https://www.yogapatha.in/'
  },
  'image': course.image_url || 'https://www.yogapatha.in/logo.png'
});

export const getTrainerSchema = (trainer) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  'name': trainer.full_name,
  'description': trainer.bio || `Certified Yoga Trainer at YogaPatha`,
  'image': trainer.profile_image || 'https://www.yogapatha.in/logo.png',
  'jobTitle': 'Yoga Instructor',
  'worksFor': {
    '@type': 'Organization',
    'name': 'YogaPatha'
  }
});
