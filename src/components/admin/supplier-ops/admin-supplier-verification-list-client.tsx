'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminSupplierVerificationListQuery } from '@/hooks/admin/useAdminSupplierVerification'
import { useI18n } from '@/hooks/useI18n'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import type { BadgeProps } from '@/components/ui/badge'
import type { SupplierVerificationCaseStatus } from '@/types/supplier-ops.types'

function statusIntent(status: SupplierVerificationCaseStatus): NonNullable<BadgeProps['intent']> {
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_PROGRESS') return 'warning'
  return 'default'
}

function verificationStatusLabel(
  m: {
    verificationStatusDraft: string
    verificationStatusInProgress: string
    verificationStatusCompleted: string
  },
  status: SupplierVerificationCaseStatus
): string {
  switch (status) {
    case 'DRAFT':
      return m.verificationStatusDraft
    case 'IN_PROGRESS':
      return m.verificationStatusInProgress
    case 'COMPLETED':
      return m.verificationStatusCompleted
    default: {
      const _x: never = status
      return _x
    }
  }
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="h-[120px] animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high" />
        </li>
      ))}
    </ul>
  )
}

export function AdminSupplierVerificationListClient() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierVerificationListQuery()
  const items = q.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.verificationPageTitle}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{m.verificationPageSubtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />
      {q.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : m.loadError}
        </div>
      ) : null}
      {q.isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Card className="border-outline/10 bg-surface-container-lowest dark:border-outline/15">
          <CardContent className="p-8 text-center text-on-surface-variant">{m.verificationEmpty}</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={withLocaleUrl(`/admin/supplier-verification/${c.id}`, locale)}>
                <Card className="border-outline/10 bg-surface-container-lowest transition-colors hover:border-primary/40 dark:border-outline/15">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-on-surface-variant">{c.referenceCode}</p>
                      <p className="truncate text-lg font-bold text-on-surface">{c.headline}</p>
                      <p className="truncate text-sm text-on-surface-variant">{c.supplierName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge intent={statusIntent(c.status)}>{verificationStatusLabel(m, c.status)}</Badge>
                      <span className="font-mono text-sm font-bold text-primary">{c.complianceScore}</span>
                      <ChevronRight className="h-5 w-5 text-on-surface-variant" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
