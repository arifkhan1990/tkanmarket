import type { Metadata } from 'next'

import { AdminCommissionRulesClient } from '@/components/admin/commission/AdminCommissionRulesClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Commission Rules',
  description: 'Configure marketplace commission rules by category.'
}

export default function AdminCommissionRulesPage() {
  return <AdminCommissionRulesClient />
}
