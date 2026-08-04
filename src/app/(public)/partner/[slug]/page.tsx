import type { Metadata } from 'next'

import { PartnerPortalClient } from '@/components/public/PartnerPortalClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const m = getMessages(await getServerLocale())
  return {
    title: `${m.partnerPortalPage.title} · ${decodeURIComponent(params.slug)}`,
    description: m.partnerPortalPage.subtitle
  }
}

export default async function PartnerPortalPage(props: Props) {
  const params = await props.params
  const slug = decodeURIComponent(params.slug)
  return <PartnerPortalClient supplierSlug={slug} />
}
