'use client'

import Link from 'next/link'

import { AdminRbacRolesTabContent } from '@/components/admin/access/AdminRbacRolesTabContent'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'

export function AdminRolesPermissionsPageClient() {
  const { messages } = useI18n()
  const access = messages.admin.accessPage
  const rbac = messages.admin.rbacPage

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{rbac.heroTitle}</h1>
          <p className="text-lg leading-relaxed text-on-surface-variant">{rbac.heroSubtitle}</p>
        </div>
        <Button asChild variant="outline" className="h-11 w-fit shrink-0 rounded-xl font-semibold">
          <Link href="/admin/access">{access.title}</Link>
        </Button>
      </div>
      <AdminRbacRolesTabContent />
    </div>
  )
}
