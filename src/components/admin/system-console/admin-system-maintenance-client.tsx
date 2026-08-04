'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminSystemMaintenance, useUpdateSystemMaintenance } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import type { SystemMaintenanceConfigDto } from '@/types/system-console.types'
import { cn } from '@/lib/utils'

function formatLocalPreview(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function MaintenancePreview({ values }: { values: SystemMaintenanceConfigDto }) {
  const progress = Math.max(0, Math.min(100, values.migrationProgress))

  return (
    <Card className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70">
      <CardHeader className="space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Live preview</h3>
        <p className="text-sm text-on-surface-variant">This is how the public `/maintenance` page will look.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary-container/15" />
            <div className="relative p-6 sm:p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-primary-fixed-variant">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    values.isEnabled ? 'bg-primary animate-pulse' : 'bg-outline'
                  )}
                />
                {values.isEnabled ? 'Maintenance enabled' : 'Maintenance disabled'}
              </div>

              <h4 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {values.headline?.trim() ? values.headline : 'Under maintenance'}
              </h4>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                {values.body?.trim()
                  ? values.body
                  : 'We are currently fine-tuning the marketplace to provide a smoother, more secure experience.'}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-container-low/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Scheduled start</p>
                  <p className="mt-1 font-mono text-xs text-on-surface">{formatLocalPreview(values.scheduledStart)}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Scheduled end</p>
                  <p className="mt-1 font-mono text-xs text-on-surface">{formatLocalPreview(values.scheduledEnd)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-surface-container-high/60 p-4">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold text-on-surface">Backend migrations</p>
                    <p className="text-[11px] text-on-surface-variant">Progress shown to visitors</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-on-surface-variant">
                System ID: <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[11px]">{values.systemIdLabel}</span>
              </div>
            </div>
          </div>

          <div className="relative h-40 w-full bg-surface-container-high sm:h-48">
            {values.heroImageUrl ? (
              <Image
                src={values.heroImageUrl}
                alt=""
                fill
                className="object-cover opacity-90 grayscale"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-surface-container-high" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/70 to-transparent" />
          </div>
        </div>

        <div className="text-xs text-on-surface-variant">
          Tip: after saving, check the public page at <span className="font-mono text-on-surface">/maintenance</span>.
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminSystemMaintenanceClient() {
  const { messages } = useI18n()
  const q = useAdminSystemMaintenance()
  const mut = useUpdateSystemMaintenance()
  const [draft, setDraft] = useState<SystemMaintenanceConfigDto | null>(null)

  const base = q.data
  const values = useMemo(() => {
    if (!base) return null
    if (draft) return draft
    return { ...base }
  }, [base, draft])

  if (q.isLoading || !values) {
    return <div className="h-64 animate-pulse rounded-3xl bg-surface-container-high" />
  }

  const patch = (p: Partial<typeof values>) => setDraft((d) => ({ ...(d ?? values), ...p }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
          {messages.admin.sidebar.systemMaintenance}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
          Control public maintenance page copy, countdown context, and migration progress display.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-7">
          <Card className="rounded-3xl border border-outline/10">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Maintenance mode</h3>
                <p className="text-sm text-on-surface-variant">
                  When enabled, visitors can see the public maintenance experience.
                </p>
              </div>
              <Checkbox checked={values.isEnabled} onCheckedChange={(v) => patch({ isEnabled: Boolean(v) })} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-on-surface">Headline</span>
                <Input
                  value={values.headline}
                  onChange={(e) => patch({ headline: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-on-surface">Body</span>
                <Textarea
                  value={values.body}
                  onChange={(e) => patch({ body: e.target.value })}
                  className="min-h-[120px] rounded-xl"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-on-surface">Scheduled start (ISO)</span>
                  <Input
                    type="datetime-local"
                    value={values.scheduledStart ? new Date(values.scheduledStart).toISOString().slice(0, 16) : ''}
                    onChange={(e) =>
                      patch({
                        scheduledStart: e.target.value ? new Date(e.target.value).toISOString() : null
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-on-surface">Scheduled end (ISO)</span>
                  <Input
                    type="datetime-local"
                    value={values.scheduledEnd ? new Date(values.scheduledEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) =>
                      patch({
                        scheduledEnd: e.target.value ? new Date(e.target.value).toISOString() : null
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-on-surface">Migration progress ({values.migrationProgress}%)</span>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={values.migrationProgress}
                  onChange={(e) => patch({ migrationProgress: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-on-surface">System ID label</span>
                <Input
                  value={values.systemIdLabel}
                  onChange={(e) => patch({ systemIdLabel: e.target.value })}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-on-surface">Hero image URL (optional)</span>
                <Input
                  value={values.heroImageUrl ?? ''}
                  onChange={(e) => patch({ heroImageUrl: e.target.value || null })}
                  className="rounded-xl"
                  placeholder="https://"
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDraft(null)
                    void q.refetch()
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  disabled={mut.isPending}
                  onClick={() =>
                    mut.mutate({
                      ...values
                    })
                  }
                >
                  {mut.isPending ? 'Saving…' : 'Save maintenance config'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-5 xl:sticky xl:top-6">
          <MaintenancePreview values={values} />
        </div>
      </div>
    </div>
  )
}
