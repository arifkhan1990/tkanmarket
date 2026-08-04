'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Link2,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Tag,
  Trophy,
  User,
  XCircle
} from 'lucide-react'

import type { LeadDetail } from '@/types/lead.types'
import type { LeadStatus } from '@/types/marketplace.types'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useAdminLeadDetail } from '@/hooks/admin/useAdminLeadDetail'
import { LeadActivityTimeline } from '@/components/admin/LeadActivityTimeline'
import { AddNoteForm } from '@/components/admin/AddNoteForm'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/* ─── Status style map ───────────────────────────────────────────── */
const STATUS_CLS: Record<LeadStatus, string> = {
  NEW:           'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED:     'bg-amber-100 text-amber-700 border-amber-200',
  QUALIFIED:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  PROPOSAL_SENT: 'bg-violet-100 text-violet-700 border-violet-200',
  NEGOTIATING:   'bg-orange-100 text-orange-700 border-orange-200',
  CLOSED_WON:    'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
  CLOSED_LOST:   'bg-red-100 text-red-700 border-red-200'
}

const SOURCE_CLS: Record<string, string> = {
  MARKETPLACE_INQUIRY: 'bg-primary/10 text-primary',
  SAMPLE_REQUEST:      'bg-amber-100 text-amber-700',
  SOCIAL_CAMPAIGN:     'bg-emerald-100 text-emerald-700',
  DIRECT_CONTACT:      'bg-secondary/10 text-secondary',
  MANUAL_ENTRY:        'bg-surface-container-high text-on-surface-variant'
}

/* ─── Pipeline stages ────────────────────────────────────────────── */
const PIPELINE = [
  { key: 'NEW',           label: 'New',         color: 'text-blue-600   bg-blue-500'   },
  { key: 'CONTACTED',     label: 'Contacted',   color: 'text-amber-600  bg-amber-500'  },
  { key: 'QUALIFIED',     label: 'Qualified',   color: 'text-emerald-600 bg-emerald-500'},
  { key: 'PROPOSAL_SENT', label: 'Proposal',    color: 'text-violet-600 bg-violet-500' },
  { key: 'NEGOTIATING',   label: 'Negotiating', color: 'text-orange-600 bg-orange-500' },
  { key: 'CLOSED',        label: 'Closed',      color: 'text-slate-600  bg-slate-500'  }
] as const

type PipelineKey = (typeof PIPELINE)[number]['key']

const STATUS_TO_STEP: Record<LeadStatus, number> = {
  NEW: 0, CONTACTED: 1, QUALIFIED: 2, PROPOSAL_SENT: 3, NEGOTIATING: 4,
  CLOSED_WON: 5, CLOSED_LOST: 5
}

const STEP_TO_STATUS: Record<number, LeadStatus> = {
  0: 'NEW', 1: 'CONTACTED', 2: 'QUALIFIED', 3: 'PROPOSAL_SENT', 4: 'NEGOTIATING'
}

/* ─── Score helpers ──────────────────────────────────────────────── */
function scoreRingCls(score: number) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 45) return 'text-amber-600'
  return 'text-red-500'
}

function scoreBarCls(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-red-400'
}

/* ─── Won/Lost dialog ────────────────────────────────────────────── */
interface WonLostDialogProps {
  companyName: string
  onWon: () => void
  onLost: () => void
  onCancel: () => void
}
function WonLostDialog({ companyName, onWon, onLost, onCancel }: WonLostDialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-outline/15 bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal aria-labelledby="wonlost-title"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Close lead</p>
        <h2 id="wonlost-title" className="mt-1 text-base font-bold text-on-surface">{companyName}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Mark this lead as won or lost?</p>
        <div className="mt-5 flex gap-3">
          <Button type="button" className="flex-1 gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={onWon}>
            <Trophy className="h-4 w-4" /> Won
          </Button>
          <Button type="button" variant="destructive" className="flex-1 gap-2 rounded-xl" onClick={onLost}>
            <XCircle className="h-4 w-4" /> Lost
          </Button>
        </div>
        <button type="button" onClick={onCancel} className="mt-3 w-full rounded-xl py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─── Section card ───────────────────────────────────────────────── */
function Section({ title, icon: Icon, children, className }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm', className)}>
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
            </span>
          )}
          <h2 className="text-sm font-bold tracking-tight text-on-surface">{title}</h2>
        </div>
      )}
      {children}
    </section>
  )
}

/* ─── Info row ───────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false, copyable = false }: {
  label: string; value: string | null | undefined; mono?: boolean; copyable?: boolean
}) {
  const [copied, setCopied] = React.useState(false)
  if (!value) return null

  function copy() {
    void navigator.clipboard.writeText(value ?? '').then(() => {
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group/row">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-outline">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={cn('text-sm font-medium text-on-surface flex-1 min-w-0 truncate', mono && 'font-mono text-xs')}>
          {value}
        </p>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            className="shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
            aria-label={`Copy ${label}`}
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-500" />
              : <ClipboardCopy className="h-3.5 w-3.5 text-outline hover:text-primary" />
            }
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-score bar ──────────────────────────────────────────────── */
function SubScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-mono font-semibold text-on-surface">{value.toFixed(1)} / 10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ─── WhatsApp href ──────────────────────────────────────────────── */
function waHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}

/* ─── Stat chip ──────────────────────────────────────────────────── */
function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-outline/10 bg-surface-container-low px-3 py-2 min-w-[80px]">
      <span className="text-base font-bold tabular-nums text-on-surface">{value}</span>
      <span className="text-[10px] font-medium text-on-surface-variant">{label}</span>
    </div>
  )
}

/* ─── Pipeline stepper ───────────────────────────────────────────── */
function PipelineStepper({
  currentStatus,
  onStep,
  isPending
}: {
  currentStatus: LeadStatus
  onStep: (step: number) => void
  isPending: boolean
}) {
  const currentStep = STATUS_TO_STEP[currentStatus]
  const isClosed = currentStatus === 'CLOSED_WON' || currentStatus === 'CLOSED_LOST'

  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pipeline Stage</span>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0">
        {PIPELINE.map((stage, idx) => {
          const isDone    = currentStep > idx
          const isCurrent = currentStep === idx
          const [colorText, colorBg] = stage.color.split('  ')
          const isClosedStage = idx === 5

          return (
            <React.Fragment key={stage.key}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors',
                    currentStep >= idx ? 'bg-primary/50' : 'bg-outline/15'
                  )}
                />
              )}

              {/* Step button */}
              <button
                type="button"
                disabled={isPending}
                onClick={() => onStep(idx)}
                title={`Move to ${stage.label}`}
                className={cn(
                  'group/step relative flex flex-col items-center gap-1.5 focus-visible:outline-none',
                  'disabled:cursor-not-allowed',
                  idx === 0 && 'items-start',
                  idx === PIPELINE.length - 1 && 'items-end'
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    'group-hover/step:scale-110',
                    isDone || (isCurrent && isClosed)
                      ? `${colorBg} border-transparent text-white`
                      : isCurrent
                        ? `border-current ${colorText} bg-background ring-2 ring-offset-1 ring-current`
                        : 'border-outline/25 bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : isClosed && isClosedStage ? (
                    currentStatus === 'CLOSED_WON'
                      ? <Trophy className="h-3.5 w-3.5" aria-hidden />
                      : <XCircle className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-[10px] font-semibold tracking-tight md:block',
                    isCurrent ? colorText : isDone ? 'text-on-surface-variant' : 'text-outline'
                  )}
                >
                  {isClosedStage && isClosed
                    ? currentStatus === 'CLOSED_WON' ? 'Won' : 'Lost'
                    : stage.label}
                </span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Time in stage */}
      <p className="mt-3 text-[10px] text-on-surface-variant">
        Current stage:{' '}
        <span className="font-semibold text-on-surface">
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </p>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export function LeadDetailClient({ initial }: { initial: LeadDetail }) {
  const qc = useQueryClient()
  const usersQuery = useAdminUsers({ role: 'SALES' })
  const { messages } = useI18n()
  const m = messages.admin.leadDetailPage

  const query = useAdminLeadDetail(initial.lead.id, initial)
  const detail = query.data?.success ? query.data.data : initial

  /* Pending Won/Lost confirmation */
  const [pendingClose, setPendingClose] = React.useState(false)

  const update = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await fetch(`/api/v1/admin/leads/${detail.lead.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-lead-detail', detail.lead.id] })
      toast.success(messages.admin.leads.saved)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : messages.admin.leads.updateFailed)
    }
  })

  function handlePipelineStep(stepIdx: number) {
    if (stepIdx === 5) {
      setPendingClose(true)
      return
    }
    const status = STEP_TO_STATUS[stepIdx]
    if (status && status !== detail.lead.status) {
      update.mutate({ action: 'update_status', status })
    }
  }

  function confirmClose(status: 'CLOSED_WON' | 'CLOSED_LOST') {
    setPendingClose(false)
    update.mutate({ action: 'update_status', status })
  }

  const whatsapp = waHref(detail.lead.phone)
  const score = detail.scoring.total

  /* Lead age & stats */
  const leadAge = differenceInDays(new Date(), new Date(detail.lead.createdAt))
  const lastActivity = detail.activity.length > 0
    ? formatDistanceToNow(new Date(detail.activity[detail.activity.length - 1]!.createdAt), { addSuffix: true })
    : '—'

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-[var(--admin-topbar-height)] z-30 border-b border-outline/10 bg-background/95 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" asChild>
              <Link href="/admin/leads" aria-label={m.backToPipeline}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Link href="/admin/leads" className="hover:text-primary transition-colors">{m.crumbLeads}</Link>
              <span className="text-outline" aria-hidden>/</span>
              <span className="max-w-[140px] truncate font-semibold text-on-surface">{detail.lead.companyName}</span>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status pill */}
            <span className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', STATUS_CLS[detail.lead.status])}>
              {detail.lead.status.replace(/_/g, ' ')}
            </span>
            {/* Score badge */}
            <span className={cn('hidden rounded-full border border-outline/20 bg-surface-container-low px-3 py-1 text-xs font-bold sm:inline-flex', scoreRingCls(score))}>
              Score {score}
            </span>
            {/* Quick CTAs */}
            {whatsapp && (
              <Button size="sm" className="gap-2 rounded-xl font-bold shadow-md shadow-primary/15" asChild>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> {m.whatsappCta}
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-2 rounded-xl border-outline/20" asChild>
              <a href={`mailto:${detail.lead.email}`}>
                <Mail className="h-4 w-4" /> {m.emailCta}
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-1 pt-5">

        {/* ── Hero row ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', SOURCE_CLS[detail.lead.source])}>
                {detail.lead.source.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-xs text-outline">#{detail.lead.id}</span>
            </div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
              {detail.lead.contactName}
            </h1>
            <p className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {detail.lead.companyName}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {detail.lead.country}{detail.lead.city ? ` · ${detail.lead.city}` : ''}
            </p>
          </div>

          {/* Right: score + stats */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-outline/10 bg-surface-container-low px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Score</span>
              <span className={cn('font-heading text-3xl font-extrabold', scoreRingCls(score))}>{score}</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high">
                <div className={cn('h-full rounded-full', scoreBarCls(score))} style={{ width: `${score}%` }} />
              </div>
            </div>
            {/* Stat chips */}
            <div className="flex flex-col gap-2">
              <StatChip label="Age (days)" value={leadAge} />
              <StatChip label="Notes" value={detail.notes.length} />
              <StatChip label="Activities" value={detail.activity.length} />
            </div>
          </div>
        </div>

        {/* ── Pipeline stepper ─────────────────────────────────────── */}
        <PipelineStepper
          currentStatus={detail.lead.status}
          onStep={handlePipelineStep}
          isPending={update.isPending}
        />

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Left: details */}
          <div className="space-y-4 lg:col-span-7">

            {/* Contact info */}
            <Section title={m.contactSection} icon={User}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label={messages.admin.leads.fields.email}   value={detail.lead.email}   copyable />
                <InfoRow label={messages.admin.leads.fields.phone}   value={detail.lead.phone}   copyable />
                <InfoRow label={messages.admin.leads.fields.company} value={detail.lead.companyName} copyable />
                <InfoRow label={messages.admin.leads.fields.country} value={`${detail.lead.country}${detail.lead.city ? ` · ${detail.lead.city}` : ''}`} />
              </div>
              {/* Contact action buttons */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-outline/10 pt-4">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-outline/20" asChild>
                  <a href={`mailto:${detail.lead.email}`}><Mail className="h-3.5 w-3.5" /> Email</a>
                </Button>
                {detail.lead.phone && (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl border-outline/20" asChild>
                    <a href={`tel:${detail.lead.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                  </Button>
                )}
                {whatsapp && (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl border-outline/20" asChild>
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                  </Button>
                )}
              </div>
            </Section>

            {/* Inquiry */}
            <Section title={m.inquirySection} icon={MessageCircle}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                {detail.lead.inquiryText || <span className="text-outline italic">No inquiry text</span>}
              </p>
            </Section>

            {/* Fabric + Score breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <Section title={m.fabricSection} icon={Tag}>
                {detail.fabric ? (
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                      {detail.fabric.imageUrl
                        ? <Image src={detail.fabric.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                        : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/fabrics/${detail.fabric.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                      >
                        <span className="truncate">{detail.fabric.titleRu}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{detail.fabric.supplierName}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">{m.noFabric}</p>
                )}
              </Section>

              <Section title={m.metricsSection} icon={Share2}>
                <div className="space-y-3">
                  <SubScoreBar label={m.subBudget}  value={detail.scoring.budgetAlignment} />
                  <SubScoreBar label={m.subVolume}  value={detail.scoring.volumeRequirement} />
                  <SubScoreBar label={m.subUrgency} value={detail.scoring.urgencyTimeline} />
                </div>
              </Section>
            </div>

            {/* UTM tracking */}
            {(detail.lead.utmSource || detail.lead.utmCampaign) && (
              <Section title="UTM Tracking" icon={Link2}>
                <div className="grid gap-4 sm:grid-cols-3">
                  {detail.lead.utmSource   && <InfoRow label="Source"   value={detail.lead.utmSource}   mono copyable />}
                  {detail.lead.utmCampaign && <InfoRow label="Campaign" value={detail.lead.utmCampaign} mono copyable />}
                  {detail.lead.utmMedium   && <InfoRow label="Medium"   value={detail.lead.utmMedium}   mono copyable />}
                </div>
              </Section>
            )}

            {/* Signals */}
            <Section title={m.insightSection} icon={Lightbulb}>
              <p className="rounded-xl border-l-4 border-primary/40 bg-primary/[0.04] px-5 py-4 text-sm italic leading-relaxed text-on-surface">
                {m.insightIntro}{' '}
                <span className="font-semibold not-italic">{detail.lead.companyName}</span>.{' '}
                {m.insightScoreLine
                  .replace('{score}', String(detail.scoring.total))
                  .replace('{urgency}', detail.scoring.urgencyTimeline.toFixed(1))}{' '}
                {m.insightOutro}
              </p>
            </Section>

            {/* Status & assignment */}
            <Section title={m.manageSection} icon={Building2}>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {messages.admin.leads.fields.status}
                  </p>
                  <Select
                    value={detail.lead.status}
                    onValueChange={(v) => {
                      if (v === 'CLOSED_WON' || v === 'CLOSED_LOST') {
                        update.mutate({ action: 'update_status', status: v })
                      } else {
                        update.mutate({ action: 'update_status', status: v })
                      }
                    }}
                    disabled={update.isPending}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-outline/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['NEW','CONTACTED','QUALIFIED','PROPOSAL_SENT','NEGOTIATING','CLOSED_WON','CLOSED_LOST'] as LeadStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {messages.admin.leads.fields.assignTo}
                  </p>
                  <Select
                    value={String(detail.lead.assignedToId ?? '')}
                    onValueChange={(v) => update.mutate({ action: 'assign', user_id: Number(v) })}
                    disabled={update.isPending}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-outline/20">
                      <SelectValue placeholder={messages.admin.leads.selectUser} />
                    </SelectTrigger>
                    <SelectContent>
                      {(usersQuery.data ?? []).map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current assignee avatar */}
              {detail.assignedTo && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-outline/10 bg-surface-container-low/50 px-4 py-3">
                  <Avatar className="h-8 w-8">
                    {detail.assignedTo.avatarUrl
                      ? <AvatarImage src={detail.assignedTo.avatarUrl} alt={detail.assignedTo.name} />
                      : null}
                    <AvatarFallback className="text-xs">{detail.assignedTo.name.trim()[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">{detail.assignedTo.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{detail.assignedTo.email}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" aria-hidden />
                </div>
              )}

              {update.isPending && (
                <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </div>
              )}
            </Section>
          </div>

          {/* Right: sticky timeline + add note */}
          <div className="space-y-4 lg:col-span-5">
            <div className={cn('lg:sticky lg:top-[calc(var(--admin-topbar-height)+72px)]', 'space-y-4')}>

              {/* Last activity */}
              <div className="flex items-center gap-2 rounded-2xl border border-outline/10 bg-surface-container-lowest px-4 py-3 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-on-surface-variant">
                  Last activity: <span className="font-semibold text-on-surface">{lastActivity}</span>
                </span>
              </div>

              {/* Add note */}
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-on-surface">{messages.admin.leads.addNoteTitle}</p>
                <AddNoteForm leadId={detail.lead.id} />
              </div>

              {/* Timeline */}
              <div className="max-h-[min(60vh,540px)] overflow-y-auto overscroll-contain rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
                <LeadActivityTimeline leadId={detail.lead.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Won/Lost dialog — pipeline stepper trigger */}
      {pendingClose && (
        <WonLostDialog
          companyName={detail.lead.companyName}
          onWon={() => confirmClose('CLOSED_WON')}
          onLost={() => confirmClose('CLOSED_LOST')}
          onCancel={() => setPendingClose(false)}
        />
      )}
    </div>
  )
}
