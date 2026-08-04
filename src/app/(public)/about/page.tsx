import type { Metadata } from 'next'

import { AboutPageContent } from '@/components/public/about/about-page-content'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.about.metaTitle,
    description: m.about.metaDescription,
  }
}

export default async function AboutPage() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <PublicPageShell className="pb-10 pt-6 md:pb-14 md:pt-8" blur="sm" contentClassName="space-y-8">
      <Breadcrumb items={[{ label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) }, { label: m.nav.about }]} />
      <AboutPageContent locale={locale} />
    </PublicPageShell>
  )
}

