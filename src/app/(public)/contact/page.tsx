import type { Metadata } from 'next'

import { ContactPageClient } from '@/components/marketplace/contact/ContactPageClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const title = m.contactPage.metaTitle
  const description = m.contactPage.metaDescription
  return {
    title,
    description,
    openGraph: {
      title: m.common.brand,
      description,
      images: ['/og-placeholder.svg'],
    },
  }
}

export default function ContactPage() {
  return <ContactPageClient />
}

