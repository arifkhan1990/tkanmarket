'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronRight, ImageIcon, Loader2 } from 'lucide-react'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdminSupplierVerificationDetailQuery,
  useAdminSupplierVerificationPatchMutation
} from '@/hooks/admin/useAdminSupplierVerification'
import { useI18n } from '@/hooks/useI18n'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type { VerificationChecklistItem } from '@/types/supplier-ops.types'

function checklistIcon(state: VerificationChecklistItem['state']) {
  if (state === 'completed') return <CheckCircle2 className="h-5 w-5 text-primary" />
  if (state === 'processing') return <Loader2 className="h-5 w-5 text-primary animate-spin" />
  if (state === 'error') return <AlertTriangle className="h-5 w-5 text-destructive" />
  return <ImageIcon className="h-5 w-5 text-on-surface-variant" />
}

function VerificationDetailSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <>
      <SupplierSuiteSubNav className="mb-0" />
      <div className="space-y-6" aria-busy="true" aria-label={loadingLabel}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-surface-container-high" />
          <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-sm bg-surface-container-high/80" aria-hidden />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
        </div>

        <header className="space-y-4">
          <div className="h-10 max-w-xl animate-pulse rounded-lg bg-surface-container-high md:h-12 md:max-w-2xl" />
          <div className="h-4 max-w-2xl animate-pulse rounded bg-surface-container-high" />
          <div className="h-4 max-w-lg animate-pulse rounded bg-surface-container-high" />
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-surface-container-high" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="overflow-hidden border-outline/10 bg-surface-container-lowest">
              <CardContent className="flex flex-col items-center gap-10 p-8 md:flex-row">
                <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
                  <div className="absolute inset-2 animate-pulse rounded-full border-8 border-surface-container-high bg-surface-container-low/50" />
                  <div className="h-14 w-20 animate-pulse rounded-md bg-surface-container-high" />
                </div>
                <div className="grid w-full flex-1 grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-surface-container-high" />
                      <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-container-high" />
                      <div className="h-3 w-10 animate-pulse rounded bg-surface-container-high ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-outline/10 bg-surface-container-lowest">
              <CardHeader>
                <div className="h-5 w-48 animate-pulse rounded bg-surface-container-high" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-outline/10 bg-surface-container-low/50 p-4">
                    <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded bg-surface-container-high" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 max-w-sm animate-pulse rounded bg-surface-container-high w-[75%]" />
                      <div className="h-3 w-full animate-pulse rounded bg-surface-container-high" />
                      <div className="h-3 w-[80%] animate-pulse rounded bg-surface-container-high" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="border-outline/10 bg-surface-container-low/80">
              <CardHeader>
                <div className="h-5 w-36 animate-pulse rounded bg-surface-container-high" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-[120px] w-full animate-pulse rounded-lg bg-surface-container-high" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-surface-container-high" />
              </CardContent>
            </Card>
            <Card className="border-outline/10 bg-surface-container-lowest">
              <CardHeader>
                <div className="h-5 w-40 animate-pulse rounded bg-surface-container-high" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-14 max-w-[95%] animate-pulse rounded-2xl bg-surface-container-high',
                      i % 2 === 0 ? 'mr-auto' : 'ml-auto'
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

export function AdminSupplierVerificationDetailClient({ caseId }: { caseId: number }) {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierVerificationDetailQuery(caseId)
  const patch = useAdminSupplierVerificationPatchMutation(caseId)
  const row = q.data
  const [note, setNote] = React.useState('')

  React.useEffect(() => {
    if (row?.internalNote != null) setNote(row.internalNote)
  }, [row?.internalNote])

  if (!Number.isFinite(caseId) || caseId < 1) {
    return (
      <div className="space-y-6">
        <SupplierSuiteSubNav className="mb-0" />
        <EmptyState title={m.verificationCaseNotFoundTitle} description={m.verificationCaseInvalidIdDescription} />
      </div>
    )
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <VerificationDetailSkeleton loadingLabel={m.loading} />
      </div>
    )
  }

  if (!row) {
    return (
      <div className="space-y-6">
        <SupplierSuiteSubNav className="mb-0" />
        <EmptyState title={m.verificationCaseNotFoundTitle} description={m.verificationCaseNotFoundDescription} />
      </div>
    )
  }

  const dash = 2 * Math.PI * 88
  const offset = dash * (1 - row.complianceScore / 100)

  return (
    <div className="space-y-6">
      <SupplierSuiteSubNav className="mb-0" />
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href={withLocaleUrl('/admin/supplier-verification', locale)} className="hover:text-primary">
          {m.verificationPageTitle}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-on-surface">{row.referenceCode}</span>
      </nav>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{row.headline}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{row.summary}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => patch.mutate({ internal_note: note, status: row.status })}
            disabled={patch.isPending}
          >
            {m.verificationSaveProgress}
          </Button>
          <Button onClick={() => patch.mutate({ status: 'COMPLETED' })} disabled={patch.isPending}>
            {m.verificationFinalize}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-8 flex flex-col md:flex-row gap-10 items-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-surface-container-highest"
                    aria-hidden
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold text-on-surface">{row.complianceScore}</span>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                    {m.verificationComplianceShortLabel}
                  </span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                {(
                  [
                    [m.verificationMetricLabor, row.laborPct],
                    [m.verificationMetricEnvironment, row.envPct],
                    [m.verificationMetricSupplyChain, row.supplyPct],
                    [m.verificationMetricFiscal, row.fiscalPct]
                  ] as const
                ).map(([label, pct]) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs font-medium uppercase text-on-surface-variant">{label}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-right text-[10px] font-mono font-bold text-primary">{pct}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-outline/10 bg-surface-container-lowest">
            <CardHeader>
              <h3 className="text-lg font-semibold leading-none tracking-tight text-on-surface">{m.verificationDetailChecklist}</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {row.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-2xl border border-outline/10 bg-surface-container-low/50 p-4"
                >
                  <div className="mt-0.5">{checklistIcon(item.state)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {row.facilityPhotoUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {row.facilityPhotoUrls.slice(0, 3).map((url, idx) => (
                <div
                  key={url}
                  className={cn(
                    idx === 0 ? 'col-span-2 h-64' : 'h-32',
                    'relative overflow-hidden rounded-3xl bg-surface-container-high'
                  )}
                >
                  <Image
                    src={url}
                    alt={m.verificationFacilityPhotoAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={isRemoteImageSrc(url)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 bg-muted/30">
            <CardHeader>
              <h3 className="text-base font-semibold leading-none tracking-tight text-on-surface">{m.verificationDetailNoteLabel}</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} className="resize-none" />
              <Button className="w-full" variant="secondary" onClick={() => patch.mutate({ internal_note: note })} disabled={patch.isPending}>
                {m.verificationSaveNote}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-outline/10 bg-surface-container-lowest">
            <CardHeader>
              <h3 className="text-base font-semibold leading-none tracking-tight text-on-surface">{m.verificationDetailThread}</h3>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {row.messages.map((msg, i) => (
                <div
                  key={`${msg.at}-${i}`}
                  className={cn(
                    'max-w-[95%] rounded-2xl px-3 py-2',
                    msg.role === 'admin'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-surface-container-high text-on-surface'
                  )}
                >
                  {msg.body}
                  <div className="text-[10px] opacity-70 mt-1">{msg.at}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
