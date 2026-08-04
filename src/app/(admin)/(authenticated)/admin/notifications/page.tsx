import type { Metadata } from 'next'

import { AdminNotificationCenterClient } from '@/components/admin/notifications/AdminNotificationCenterClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getServerLocale())
  return {
    title: m.admin.meta.notificationCenter.title,
    description: m.admin.meta.notificationCenter.description
  }
}

export default function AdminNotificationsPage() {
  return <AdminNotificationCenterClient />
}
