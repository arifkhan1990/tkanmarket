import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'TkanMarket | Advanced Analytics',
  description: 'Business analytics dashboards for leads, conversions, revenue, and suppliers.'
}

export default function AdvancedAnalyticsPage() {
  redirect('/admin/marketplace-analytics')
}

