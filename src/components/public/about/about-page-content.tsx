import type { Locale } from '@/types/i18n.types'

import { AboutHeroSection } from './about-hero-section'
import { AboutMissionSection } from './about-mission-section'
import { AboutMarketplaceScaleSection } from './about-marketplace-scale-section'
import { AboutProcessSection } from './about-process-section'
import { AboutTeamSection } from './about-team-section'
import { AboutCtaSection } from './about-cta-section'

export function AboutPageContent({ locale }: { locale: Locale }) {
  return (
    <div>
      <AboutHeroSection locale={locale} />
      <AboutMissionSection />
      <AboutMarketplaceScaleSection />
      <AboutProcessSection />
      <AboutTeamSection locale={locale} />
      <AboutCtaSection locale={locale} />
    </div>
  )
}

