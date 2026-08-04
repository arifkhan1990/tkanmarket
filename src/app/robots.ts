import type { MetadataRoute } from 'next'

import { getPublicSiteUrl } from '@/lib/utils/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/']
    },
    sitemap: `${baseUrl}/sitemap.xml`
  }
}

