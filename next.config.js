let bundleAnalyzer = null
if (process.env.ANALYZE === 'true') {
  try {
    // Optional dependency; only needed when ANALYZE=true
    bundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true })
  } catch {
    bundleAnalyzer = null
  }
}

function buildCsp() {
  const isDev = process.env.NODE_ENV === 'development'
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "media-src 'self' https: *.r2.dev blob:",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https:`,
    "style-src 'self' 'unsafe-inline' https:",
    `connect-src 'self'${isDev ? ' ws:' : ''} https:`,
    "font-src 'self' data: https:",
    // Supplier HQ embed + common map providers
    "frame-src 'self' https://www.google.com https://*.google.com https://maps.google.com https://www.openstreetmap.org https://www.youtube-nocookie.com https://www.youtube.com"
  ]
  return directives.join('; ')
}

const pkg = require('./package.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Containerized output (Cloud Run): produces .next/standalone for a minimal,
  // self-contained server image.
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version
  },
  compress: true,
  // Serializes static page data collection to avoid intermittent ENOENT on
  // .next/*-manifest.json under high parallelism (Next 16 + Turbopack/webpack).
  experimental: {
    cpus: 1
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      // Cloudflare R2 storage buckets
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-9ec523334927436694248797458dd1e6.r2.dev' },
      // Common supplier/CDN sources
      { protocol: 'https', hostname: 'cbu01.alicdn.com' },
      { protocol: 'https', hostname: 'cbu02.alicdn.com' },
      { protocol: 'https', hostname: 'cbu03.alicdn.com' },
      { protocol: 'https', hostname: 'cbu04.alicdn.com' },
      { protocol: 'https', hostname: 'sc04.alicdn.com' },
      { protocol: 'https', hostname: 'sc05.alicdn.com' },
      { protocol: 'https', hostname: 's.alicdn.com' },
      { protocol: 'https', hostname: 'img.alicdn.com' },
      { protocol: 'https', hostname: 'image.made-in-china.com' },
      { protocol: 'https', hostname: 'stat.made-in-china.com' },
      { protocol: 'https', hostname: '*.made-in-china.com' },
      { protocol: 'https', hostname: 'www.micstatic.com' }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: buildCsp() },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ]
  }
}

module.exports = bundleAnalyzer ? bundleAnalyzer(nextConfig) : nextConfig

