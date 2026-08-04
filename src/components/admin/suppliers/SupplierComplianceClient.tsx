'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { useAdminSupplierCompliance } from '@/hooks/admin/useAdminSupplierCompliance'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { isRemoteImageSrc } from '@/lib/utils'

function ComplianceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-surface-container-low animate-pulse" />
      ))}
    </div>
  )
}

export function SupplierComplianceClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.supplierCompliancePage
  const query = useAdminSupplierCompliance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.title}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{p.subtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : p.loadError}
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void query.refetch()}>
            {p.retry}
          </Button>
        </div>
      ) : null}

      {query.isLoading || !query.data ? <ComplianceSkeleton /> : null}

      {query.data ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">{p.statPending}</p>
              <p className="mt-2 font-mono text-4xl font-bold text-on-surface">{query.data.pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">{p.statVerified}</p>
              <p className="mt-2 font-mono text-4xl font-bold text-on-surface">{query.data.verifiedCount}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-on-surface">{p.queueTitle}</h2>
              <p className="text-sm text-on-surface-variant">{p.queueSubtitle}</p>
            </div>
            {query.data.queue.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-10 text-center text-on-surface-variant dark:border-outline/15">
                {p.emptyQueue}
              </p>
            ) : (
              <ul className="space-y-3">
                {query.data.queue.map((row) => (
                  <li
                    key={row.supplierId}
                    className="flex flex-col gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-4 shadow-sm dark:border-outline/15 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                        {row.logoUrl ? (
                          <Image
                            src={row.logoUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain"
                            unoptimized={isRemoteImageSrc(row.logoUrl)}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-on-surface-variant">
                            {row.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{row.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {row.country}
                          {row.city ? ` · ${row.city}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" className="rounded-xl" asChild>
                        <Link href={withLocaleUrl(`/admin/suppliers/${row.supplierId}/edit`, locale)}>{p.review}</Link>
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="rounded-xl" asChild>
                        <Link href={withLocaleUrl(`/suppliers/${row.slug}`, locale)}>{p.openPublic}</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-on-surface">{p.verifiedTitle}</h2>
              <p className="text-sm text-on-surface-variant">{p.verifiedSubtitle}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {query.data.recentlyVerified.map((row) => (
                <li
                  key={row.supplierId}
                  className="flex items-center justify-between rounded-2xl border border-outline/10 bg-surface-container-low/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{row.name}</p>
                    <p className="text-xs text-on-surface-variant">{row.country}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 rounded-lg" asChild>
                    <Link href={withLocaleUrl(`/suppliers/${row.slug}`, locale)}>{p.openPublic}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}
