import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/auth/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Googlebot'],
        allow: '/',
      },
    ],
    sitemap: 'https://creatorhq.fun/sitemap.xml',
  };
}
