'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Bug,
  CheckSquare,
  ChevronRight,
  Contact,
  FileText,
  MemoryStick,
  Search,
  Server,
  Store,
  Workflow
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAdminHelpSupportOverview } from '@/hooks/admin/useAdminHelpSupportOverview'
import { useAdminHelpSupportTicketMutation } from '@/hooks/admin/useAdminHelpSupportTicketMutation'
import { useI18n } from '@/hooks/useI18n'
import type { SupportKnowledgeCategoryDto } from '@/types/admin-help-support.types'
import { cn } from '@/lib/utils'

const KNOWLEDGE_ICONS = {
  storefront: Store,
  contact_support: Contact,
  memory: MemoryStick
} as const

function KnowledgeCard({ row }: { row: SupportKnowledgeCategoryDto }) {
  const Icon =
    row.iconKey in KNOWLEDGE_ICONS
      ? KNOWLEDGE_ICONS[row.iconKey as keyof typeof KNOWLEDGE_ICONS]
      : FileText

  return (
    <div className="group relative h-full cursor-pointer overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/15 p-2 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-headline text-lg font-bold sm:text-xl">{row.title}</h3>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">{row.description}</p>
        </div>
        {row.highlights.length > 0 ? (
          <div className={cn('grid gap-3', row.layout === 'WIDE' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
            {row.highlights.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container-high"
              >
                <CheckSquare className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-semibold">{h.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-auto flex items-center font-bold text-primary">
            Browse all templates <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <Workflow className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-on-surface opacity-5 transition-opacity group-hover:opacity-10" aria-hidden />
    </div>
  )
}

export function AdminHelpSupportCenterClient() {
  const { messages } = useI18n()
  const m = messages.admin.helpSupportPage
  const overview = useAdminHelpSupportOverview()
  const ticketMutation = useAdminHelpSupportTicketMutation()

  const [serviceArea, setServiceArea] = React.useState<'CRAWLER' | 'AI' | 'WEB' | 'DATABASE'>('CRAWLER')
  const [urgency, setUrgency] = React.useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL')
  const [subject, setSubject] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [q, setQ] = React.useState('')

  const data = overview.data
  const pipelineSnapshot = data?.pipeline
  const knowledge = data?.knowledgeCategories ?? []
  const troubleshooting = data?.troubleshooting ?? []

  const filteredTrouble = troubleshooting.filter(
    (t) =>
      q.trim().length < 2 ||
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.code.toLowerCase().includes(q.toLowerCase())
  )

  const cardWide = knowledge.find((k) => k.layout === 'WIDE')
  const cardNarrow = knowledge.find((k) => k.layout === 'NARROW')
  const cardFull = knowledge.find((k) => k.layout === 'FULL')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ticketMutation.mutate(
      { serviceArea, urgency, subject: subject.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setSubject('')
          setDescription('')
        }
      }
    )
  }

  return (
    <div className="space-y-10 pb-10">
      <section className="space-y-6">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{m.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
        <div className="relative max-w-3xl pt-2">
          <Search className="pointer-events-none absolute left-4 top-[2.15rem] z-10 h-5 w-5 text-outline" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={m.searchPlaceholder}
            className="rounded-xl border-none bg-surface-container-highest py-6 pl-12 pr-4 text-lg shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </section>

      {overview.isError ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            {overview.error instanceof Error ? overview.error.message : m.loadError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={overview.isFetching}
            onClick={() => void overview.refetch()}
          >
            {m.retry}
          </Button>
        </div>
      ) : null}

      {overview.isFetching && !overview.data ? (
        <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 rounded-xl bg-surface-container-high md:col-span-2" />
          <div className="h-64 rounded-xl bg-surface-container-high" />
        </div>
      ) : overview.isError ? null : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cardWide ? (
            <div className="md:col-span-2">
              <KnowledgeCard row={cardWide} />
            </div>
          ) : null}
          {cardNarrow ? (
            <div className="md:col-span-1">
              <KnowledgeCard row={cardNarrow} />
            </div>
          ) : null}
        </section>
      )}

      {overview.isFetching && !overview.data ? null : overview.isError ? null : cardFull ? (
        <section className="flex flex-col gap-6 rounded-xl bg-surface-container-highest p-8 md:flex-row md:items-center md:gap-12 md:p-10">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="mb-2 inline-block rounded-lg bg-primary/10 p-2 text-primary">
              <MemoryStick className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="font-headline text-2xl font-extrabold tracking-tight">{cardFull.title}</h3>
            <p className="mx-auto max-w-xl text-on-surface-variant md:mx-0">{cardFull.description}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-4 md:justify-start">
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link href="/admin/crawler/control">
                  <Bug className="mr-2 h-4 w-4" aria-hidden /> Crawler
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link href="/admin/system-health-monitor">
                  <Brain className="mr-2 h-4 w-4" aria-hidden /> Health
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link href="/admin/settings">
                  <Server className="mr-2 h-4 w-4" aria-hidden /> Settings
                </Link>
              </Button>
            </div>
          </div>
          {pipelineSnapshot ? (
            <div className="w-full rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-xl backdrop-blur md:w-1/3">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="font-headline text-sm font-bold">{m.pipelineTitle}</h4>
                <div
                  className={cn(
                    'flex items-center gap-1',
                    pipelineSnapshot.statusLabel === 'Active' ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {pipelineSnapshot.statusLabel === 'Active' ? m.pipelineActive : m.pipelineDegraded}
                  </span>
                </div>
              </div>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface-variant">{pipelineSnapshot.scraperMetricLabel}</span>
                  <span className="font-mono text-primary">{pipelineSnapshot.scraperMetricValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pipelineSnapshot.scraperBarPercent}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface-variant">{pipelineSnapshot.nlpMetricLabel}</span>
                  <span className="font-mono text-tertiary">{pipelineSnapshot.nlpMetricValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full bg-tertiary transition-all" style={{ width: `${pipelineSnapshot.nlpBarPercent}%` }} />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold">{m.commonTitle}</h2>
          <div className="space-y-3">
            {overview.isFetching && !overview.data ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-high" />
              ))
            ) : overview.isError ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {m.troubleshootingUnavailable}
              </p>
            ) : filteredTrouble.length > 0 ? (
              filteredTrouble.map((t) => (
                <div
                  key={t.id}
                  className="group flex cursor-pointer items-center justify-between rounded-xl bg-surface-container-low p-5 transition-all hover:bg-surface-container-high"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="shrink-0 rounded bg-surface-container-lowest px-2 py-1 font-mono text-xs text-on-surface-variant shadow-sm">
                      {t.code}
                    </span>
                    <span className="text-sm font-semibold">{t.title}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-outline transition-transform group-hover:translate-x-1" aria-hidden />
                </div>
              ))
            ) : troubleshooting.length === 0 ? (
              <p className="rounded-xl border border-dashed border-outline/20 bg-surface-container-low/40 px-4 py-8 text-center text-sm text-on-surface-variant">
                {m.troubleshootingEmpty}
              </p>
            ) : (
              <p className="rounded-xl border border-dashed border-outline/20 bg-surface-container-low/40 px-4 py-8 text-center text-sm text-on-surface-variant">
                {m.troubleshootingSearchNoMatches}
              </p>
            )}
          </div>
          <Button variant="ghost" className="h-auto p-0 font-bold text-primary hover:bg-transparent" asChild>
            <Link href="/admin/audit-log">
              {m.viewErrorLibrary} <BookOpen className="ml-2 inline h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h2 className="font-headline text-2xl font-bold">{m.ticketTitle}</h2>
          <p className="mb-8 text-sm text-on-surface-variant">{m.ticketSubtitle}</p>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="support-area">
                  {m.serviceArea}
                </label>
                <Select value={serviceArea} onValueChange={(v) => setServiceArea(v as typeof serviceArea)}>
                  <SelectTrigger id="support-area" className="rounded-xl border-none bg-surface-container-highest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRAWLER">Crawler &amp; scraping</SelectItem>
                    <SelectItem value="AI">AI models</SelectItem>
                    <SelectItem value="WEB">Web portal</SelectItem>
                    <SelectItem value="DATABASE">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="support-urgency">
                  {m.urgency}
                </label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                  <SelectTrigger id="support-urgency" className="rounded-xl border-none bg-surface-container-highest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High (blocked task)</SelectItem>
                    <SelectItem value="CRITICAL">Critical (system down)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="support-subject">
                {m.subject}
              </label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={3}
                className="rounded-xl border-none bg-surface-container-highest"
                placeholder="Brief summary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="support-desc">
                {m.description}
              </label>
              <Textarea
                id="support-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                rows={4}
                className="resize-none rounded-xl border-none bg-surface-container-highest"
                placeholder="Include error codes and steps to reproduce…"
              />
            </div>
            <Button
              type="submit"
              disabled={ticketMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-6 font-bold text-on-primary shadow-lg"
            >
              {m.submit}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
