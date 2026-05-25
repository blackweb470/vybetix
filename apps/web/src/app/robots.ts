import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/dashboard/*'],
    },
    sitemap: 'https://vybetix.com/sitemap.xml',
  };
}
