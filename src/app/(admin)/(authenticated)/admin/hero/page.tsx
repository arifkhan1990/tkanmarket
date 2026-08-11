import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { HeroSectionManagerClient } from '@/components/admin/hero/hero-section-manager-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.hero.title,
    description: m.admin.meta.hero.description
  }
}

export default async function AdminHeroPage() {
  await requireAdminOrRedirect()
  return <HeroSectionManagerClient />
}
