import type { Metadata } from 'next'

import { BulkInquiryPortalClient } from '@/components/public/bulk-inquiry/BulkInquiryPortalClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return {
    title: m.leads.bulk.title,
    description: m.leads.bulk.description,
    openGraph: {
      title: m.common.brand,
      description: m.leads.bulk.description,
      images: ['/og-placeholder.svg']
    }
  }
}

export default function BulkInquiryPage() {
  return <BulkInquiryPortalClient />
}

