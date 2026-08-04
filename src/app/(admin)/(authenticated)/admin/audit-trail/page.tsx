import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AdminAuditLogClient } from '@/components/admin/audit/AdminAuditLogClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Audit Trail',
  description: 'Admin audit trail of administrative and security events.'
}

export default function AdminAuditTrailPage() {
  redirect('/admin/audit-log')
}

