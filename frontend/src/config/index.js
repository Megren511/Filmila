// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://filmila-webapp.onrender.com/api'
  : 'http://localhost:8080/api';

// Video CDN Configuration (using CloudFront as per tech stack)
export const VIDEO_CDN_URL = process.env.REACT_APP_CLOUDFRONT_DOMAIN;

// Website Configuration
export const WEBSITE_URL = process.env.NODE_ENV === 'production'
  ? 'https://filmila-webapp.onrender.com'
  : 'http://localhost:3000';

// Payment Configuration (using Stripe as per tech stack)
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;

// reCAPTCHA Configuration
export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

// Social Media Links
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/filmila',
  instagram: 'https://instagram.com/filmila',
  youtube: 'https://youtube.com/filmila'
};

// SEO Configuration
export const SEO_CONFIG = {
  defaultTitle: 'Filmila - Discover & Support Local Filmmakers',
  defaultDescription: 'Watch amazing short films and directly support their creators. Join our community of film enthusiasts and filmmakers.',
  titleTemplate: '%s | Filmila',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: 'Filmila',
  },
  twitter: {
    handle: '@filmila',
    site: '@filmila',
    cardType: 'summary_large_image',
  },
};

// Film Categories
export const FILM_CATEGORIES = [
  'Drama',
  'Comedy',
  'Documentary',
  'Animation',
  'Experimental',
  'Horror',
  'Sci-Fi',
  'Action',
  'Romance',
  'Thriller'
];

// Upload Configuration (using S3 as per tech stack)
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  allowedVideoFormats: ['.mp4', '.mov', '.avi', '.webm'],
  allowedThumbnailFormats: ['.jpg', '.jpeg', '.png', '.webp'],
  maxThumbnailSize: 5 * 1024 * 1024, // 5MB
  maxTitleLength: 100,
  maxDescriptionLength: 5000,
};

// Pricing Configuration
export const PRICING_CONFIG = {
  minPrice: 0.99,
  maxPrice: 19.99,
  currency: 'USD',
  revenueShare: 0.85, // 85% to filmmaker
};

// Cache Configuration
export const CACHE_CONFIG = {
  videoTTL: 24 * 60 * 60 * 1000, // 24 hours
  thumbnailTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  viewCountThreshold: 100, // Minimum views to show count
  trendingThreshold: 1000, // Views needed to be trending
  featuredThreshold: 5000, // Views needed to be featured
};
