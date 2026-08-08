import type { Metadata } from 'next'
import { Suspense } from 'react'

import { HomeLeadForm } from '@/components/forms/HomeLeadForm'
import { CategoryGridAsync, CategoryGridFallback } from '@/components/marketplace/CategoryGrid'
import { CertificationsSection } from '@/components/marketplace/CertificationsSection'
import { FaqSection } from '@/components/marketplace/FaqSection'
import { FeaturedFabricsFallback, FeaturedFabricsSection } from '@/components/marketplace/FeaturedFabricsSection'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { HowItWorksSection } from '@/components/marketplace/HowItWorksSection'
import { NewsletterCtaSection } from '@/components/marketplace/NewsletterCtaSection'
import { TestimonialsSection } from '@/components/marketplace/TestimonialsSection'
import { TopSuppliersFallback, TopSuppliersSection } from '@/components/marketplace/TopSuppliersSection'
import { TrustStatsSection } from '@/components/marketplace/TrustStatsSection'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { generateHomeWebSiteJsonLd, getHomePageAlternates, getPublicSiteUrl } from '@/lib/utils/seo'

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <HeroSection />
      <TrustStatsSection />
      <Suspense fallback={<CategoryGridFallback />}>
        <CategoryGridAsync />
      </Suspense>
      <HowItWorksSection />
      <Suspense fallback={<FeaturedFabricsFallback />}>
        <FeaturedFabricsSection />
      </Suspense>
      
      <Suspense fallback={<TopSuppliersFallback />}>
        <TopSuppliersSection />
      </Suspense>
      <CertificationsSection />
      <TestimonialsSection />
      <FaqSection />
      <HomeLeadForm />
      <NewsletterCtaSection />
    </div>
  )
}

