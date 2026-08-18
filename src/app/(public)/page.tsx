import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'

import { CategoryGridAsync, CategoryGridFallback } from '@/components/marketplace/CategoryGrid'
import { CertificationsSection } from '@/components/marketplace/CertificationsSection'
import { FaqSection } from '@/components/marketplace/FaqSection'
import { FeaturedFabricsFallback, FeaturedFabricsSection } from '@/components/marketplace/FeaturedFabricsSection'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { HowItWorksSection } from '@/components/marketplace/HowItWorksSection'
import { NewsletterCtaSection } from '@/components/marketplace/NewsletterCtaSection'
import { TestimonialsSection } from '@/components/marketplace/TestimonialsSection'
import { TrustStatsSection } from '@/components/marketplace/TrustStatsSection'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { generateHomeWebSiteJsonLd, getHomePageAlternates, getPublicSiteUrl } from '@/lib/utils/seo'
import { serializeJsonLd } from '@/lib/utils/serialize-json'

const HomeLeadForm = dynamicImport(
  () => import('@/components/forms/HomeLeadForm').then((mod) => mod.HomeLeadForm),
  {
    loading: () => <div className="mx-auto my-12 h-64 w-full max-w-screen-2xl animate-pulse rounded-3xl bg-surface-container/30" />
  }
)

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const siteUrl = getPublicSiteUrl()

  return {
    title: m.seo.homeTitle,
    description: m.seo.homeDescription,
    alternates: getHomePageAlternates(locale),
    openGraph: {
      title: m.seo.homeTitle,
      description: m.seo.homeDescription,
      url: `${siteUrl}/${locale}`,
      siteName: m.common.brand,
      locale,
      type: 'website',
      images: ['/og-placeholder.svg']
    },
    twitter: {
      card: 'summary_large_image',
      title: m.seo.homeTitle,
      description: m.seo.homeDescription,
      images: ['/og-placeholder.svg']
    }
  }
}

export default async function HomePage() {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const homeJsonLd = generateHomeWebSiteJsonLd(locale, m.seo.homeTitle, m.seo.homeDescription)

  return (
    <div className="pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd) }} />
      <HeroSection />
      <TrustStatsSection />
      <Suspense fallback={<CategoryGridFallback />}>
        <CategoryGridAsync />
      </Suspense>
      <HowItWorksSection />
      <Suspense fallback={<FeaturedFabricsFallback />}>
        <FeaturedFabricsSection />
      </Suspense>

      <CertificationsSection />
      <TestimonialsSection />
      <FaqSection />
      <HomeLeadForm />
      <NewsletterCtaSection />
    </div>
  )
}

