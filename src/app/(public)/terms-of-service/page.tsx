import type { Metadata } from 'next'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TermsOfServiceContent } from '@/components/public/terms/terms-of-service-content'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.termsOfServicePage.metaTitle,
    description: m.termsOfServicePage.metaDescription
  }
}

export default async function TermsOfServicePage() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <PublicPageShell className="pb-14 pt-6 md:pb-20 md:pt-8" blur="sm" contentClassName="space-y-8">
      <Breadcrumb
        items={[
          { label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) },
          { label: m.termsOfServicePage.breadcrumb }
        ]}
      />
      <TermsOfServiceContent locale={locale} messages={m} />
    </PublicPageShell>
  )
}
