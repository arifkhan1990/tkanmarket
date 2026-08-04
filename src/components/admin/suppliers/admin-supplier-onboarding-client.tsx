'use client'

import Link from 'next/link'
import { Building2, CloudUpload, Factory, ShieldCheck } from 'lucide-react'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { useAdminSupplierOnboardingQuery } from '@/hooks/admin/useAdminSupplierSuiteQueries'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocaleFromPathname } from '@/lib/i18n/locale-path'
import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

const stepIcons = [Building2, Factory, ShieldCheck, CloudUpload]

export function AdminSupplierOnboardingClient() {
  const pathname = usePathname()
  const { messages, locale: ctxLocale } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? ctxLocale ?? DEFAULT_LOCALE
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierOnboardingQuery()

  if (q.isLoading || !q.data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container-high" />
        <SupplierSuiteSubNav className="mb-0" />
        <div className="h-48 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high dark:border-outline/15" />
      </div>
    )
  }

  const d = q.data
  const totalSuppliers = d.steps[0]?.completedCount ?? 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.onboardingTitle}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{m.onboardingSubtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
          <p className="text-sm text-on-surface-variant">{m.onboardingAvgCompletion}</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-primary">{d.averageCompletionPercent}%</p>
        </div>
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
          <p className="text-sm text-on-surface-variant">{m.onboardingInProgress}</p>
          <p className="mt-2 font-heading text-3xl font-extrabold">{d.suppliersInProgress}</p>
        </div>
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
          <p className="text-sm text-on-surface-variant">{m.onboardingTotal}</p>
          <p className="mt-2 font-heading text-3xl font-extrabold">{totalSuppliers}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 md:flex-nowrap">
        {d.steps.map((step, idx) => {
          const Icon = stepIcons[idx] ?? Building2
          const pct = totalSuppliers > 0 ? Math.round((step.completedCount / totalSuppliers) * 100) : 0
          const label =
            step.key === 'basic'
              ? m.stepBasic
              : step.key === 'production'
                ? m.stepProduction
                : step.key === 'verification'
                  ? m.stepVerification
                  : m.stepCatalog
          return (
            <div key={step.key} className="flex min-w-[140px] flex-1 flex-col items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md ring-4 ${
                  pct >= 80
                    ? 'bg-primary text-primary-foreground ring-primary/15'
                    : 'bg-surface-container-highest text-outline'
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <span className="text-center font-heading text-sm font-bold">{label}</span>
              <span className="text-xs text-on-surface-variant">
                {step.completedCount}/{totalSuppliers} ({pct}%)
              </span>
              {idx < d.steps.length - 1 ? (
                <div className="hidden h-0.5 flex-1 bg-surface-container-high md:mx-2 md:block md:w-full" />
              ) : null}
            </div>
          )
        })}
      </div>

      <section className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-10 text-center dark:border-outline/15">
        <p className="text-sm text-on-surface-variant">{m.onboardingHint}</p>
        <Button className="mt-4 rounded-xl" variant="default" asChild>
          <Link href={withLocaleUrl(m.onboardingDocsHref, locale)}>{m.onboardingDocs}</Link>
        </Button>
      </section>

      {q.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : m.loadError}
        </div>
      ) : null}
    </div>
  )
}
