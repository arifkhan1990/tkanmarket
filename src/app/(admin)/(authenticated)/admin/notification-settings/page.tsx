import type { Metadata } from 'next'

import { AdminNotificationSettingsClient } from '@/components/admin/notifications/AdminNotificationSettingsClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getServerLocale())
  return {
    title: m.admin.meta.notificationSettings.title,
    description: m.admin.meta.notificationSettings.description
  }
}

export default function AdminNotificationSettingsPage() {
  return <AdminNotificationSettingsClient />
}
