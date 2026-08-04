import type { Metadata } from 'next'

import { OrderTrackingPageClient } from '@/components/public/OrderTrackingPageClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

type Props = { params: Promise<{ orderReference: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const m = getMessages(await getServerLocale())
  return {
    title: `${m.orderTrackingPage.title} · ${decodeURIComponent(params.orderReference)}`,
    description: m.orderTrackingPage.subtitle
  }
}

export default async function OrderTrackingPage(props: Props) {
  const params = await props.params
  const ref = decodeURIComponent(params.orderReference)
  return <OrderTrackingPageClient orderReference={ref} />
}
