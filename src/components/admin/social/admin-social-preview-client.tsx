'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Clapperboard,
  Code2,
  Eye,
  FileText,
  LayoutGrid,
  Megaphone,
  Palette,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { SocialPreviewFrames, type PreviewMode } from '@/components/admin/social/social-preview-frames'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminSocialPost, useAdminSocialPostMutations } from '@/hooks/admin/useAdminSocialPost'
import { useI18n } from '@/hooks/useI18n'
import { ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS } from '@/lib/admin-layout'
import { cn } from '@/lib/utils'
import type { AdminSocialPostDetail } from '@/types/admin-social.types'
import type { Messages } from '@/lib/i18n/get-messages'

function pickImage(detail: { primaryImageUrl: string | null; mediaUrls: string[] | null; fabricImages: string[] | null }): string | null {
  if (detail.primaryImageUrl) return detail.primaryImageUrl
  const m = detail.mediaUrls?.find(Boolean)
  if (m) return m
  return detail.fabricImages?.find(Boolean) ?? null
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PLATFORM_TO_MODE: Record<string, PreviewMode> = {
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  PINTEREST: 'pinterest',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube'
}

function platformToMode(platform: string | null | undefined): PreviewMode {
  if (platform) {
    const m = PLATFORM_TO_MODE[platform.toUpperCase()]
    if (m) return m
  }
  return 'instagram'
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-surface-container-high text-on-surface-variant',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  VIDEO_PENDING: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
}

type PreviewMessages = Messages['admin']['socialPreviewPage']

type BodyProps = {
  detail: AdminSocialPostDetail
  postId: number
  p: PreviewMessages
  patchPost: ReturnType<typeof useAdminSocialPostMutations>['patchPost']
  schedule: ReturnType<typeof useAdminSocialPostMutations>['schedule']
  reject: ReturnType<typeof useAdminSocialPostMutations>['reject']
  publish: ReturnType<typeof useAdminSocialPostMutations>['publish']
  regenerateCarousel: ReturnType<typeof useAdminSocialPostMutations>['regenerateCarousel']
  regenerateImage: ReturnType<typeof useAdminSocialPostMutations>['regenerateImage']
  regenerateReel: ReturnType<typeof useAdminSocialPostMutations>['regenerateReel']
  router: ReturnType<typeof useRouter>
}

function SectionCard({ title, icon: Icon, action, children }: {
  title: string
  icon: React.ElementType
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline/10 bg-surface-container-low/40 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-heading text-sm font-bold text-on-surface">{title}</h2>
        </div>
        {action}
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  )
}

function RegenInlineButton({ label, pendingLabel, pending, onClick }: { label: string; pendingLabel: string; pending: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
      aria-label={label}
      title={label}
    >
      <RefreshCw className={cn('h-3 w-3', pending && 'animate-spin')} aria-hidden />
      {pending ? pendingLabel : label}
    </button>
  )
}

function SocialPreviewBody({ detail, postId, p, patchPost, schedule, reject, publish, regenerateCarousel, regenerateImage, regenerateReel, router }: BodyProps) {
  const [mode, setMode] = useState<PreviewMode>(() => platformToMode(detail.platform))
  const [caption, setCaption] = useState(() => detail.captionText ?? '')
  const [tags, setTags] = useState(() => detail.hashtags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [scheduleLocal, setScheduleLocal] = useState(() => toDatetimeLocalValue(detail.scheduledAt))

  const imageUrl = useMemo(() => detail.generatedVideoUrl ?? pickImage(detail), [detail])

  const displayName = useMemo(() => {
    if (!detail.fabricTitle) return 'tkanmarket'
    const slug = detail.fabricTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24)
    return slug || 'tkanmarket'
  }, [detail.fabricTitle])

  const onAddTag = () => {
    const raw = tagInput.trim()
    if (!raw) return
    const next = raw.startsWith('#') ? raw : `#${raw}`
    if (!tags.includes(next)) setTags((t) => [...t, next])
    setTagInput('')
  }

  const onSave = () => {
    patchPost.mutate({
      caption_text: caption,
      hashtags: tags
    })
  }

  const onSchedule = () => {
    if (!scheduleLocal) {
      toast.error(p.scheduleRequired)
      return
    }
    schedule.mutate(new Date(scheduleLocal).toISOString())
  }

  const onReject = () => {
    reject.mutate(undefined, {
      onSuccess: () => router.push('/admin/social')
    })
  }

  const meta = detail.platformMetadata ?? {}
  const postTitle = (meta.postTitle as string) || null
  const callToAction = (meta.callToAction as string) || null
  const specificationsSummary = (meta.specificationsSummary as string) || null
  const keyFeatures = Array.isArray(meta.keyFeatures) ? (meta.keyFeatures as string[]) : []
  const targetAudience = (meta.targetAudience as string) || null
  const imagePrompt = (meta.imagePrompt as string) || null
  const imageOverlayText = (meta.imageOverlayText as string) || null
  const carouselSlides = Array.isArray(meta.carouselSlides)
    ? (meta.carouselSlides as Array<{ slideNumber: number; title: string; imageDescription: string }>)
    : []
  const recommendedPostingTime = (meta.recommendedPostingTime as string) || null

  const statusBadgeClass = STATUS_BADGE[detail.status] ?? STATUS_BADGE['DRAFT']!
  const statusLabel: Record<string, string> = {
    DRAFT: p.draftBadge,
    APPROVED: p.approvedBadge,
    SCHEDULED: p.scheduledBadge,
    PUBLISHED: p.publishedBadge,
    FAILED: p.failedBadge,
    VIDEO_PENDING: p.videoPendingBadge
  }
  const contentType = detail.contentType?.replace('_', ' ').toLowerCase() || '—'
  const hasAiBreakdown =
    Boolean(postTitle) ||
    Boolean(specificationsSummary) ||
    Boolean(callToAction) ||
    Boolean(targetAudience) ||
    keyFeatures.length > 0 ||
    Boolean(imagePrompt) ||
    Boolean(imageOverlayText) ||
    carouselSlides.length > 0 ||
    Boolean(detail.scriptText)

  return (
    <div className="space-y-6 pb-40">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl" asChild>
              <Link href="/admin/social">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {p.back}
              </Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={cn('gap-1.5', statusBadgeClass)}>{statusLabel[detail.status] ?? detail.status}</Badge>
            <Badge intent="brand">{detail.platform}</Badge>
            <Badge intent="default">{contentType}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-mono font-semibold">{p.idShort} {detail.id}</span>
        </div>
      </div>

      {/* ── Platform switcher ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-outline/10 bg-surface-container-low p-1.5">
        {(
          [
            { mode: 'instagram', label: p.previewInstagram },
            { mode: 'tiktok', label: p.previewTikTok },
            { mode: 'pinterest', label: p.previewPinterest },
            { mode: 'facebook', label: p.previewFacebook },
            { mode: 'youtube', label: p.previewYouTube }
          ] as const
        ).map(({ mode: m, label }) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              mode === m ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/20' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ══ Left column: live preview ═══════════════════════════ */}
        <section className="space-y-6 xl:col-span-5">
          <SectionCard title={p.previewTitle} icon={Eye} action={
            <Badge intent="brand">{p.campaignAi}</Badge>
          }>
            <div className="flex justify-center">
              <SocialPreviewFrames
                mode={mode}
                imageUrl={imageUrl}
                caption={caption || '—'}
                displayName={displayName}
                platformLabel={detail.platform}
                tiktokLabels={{ following: p.tiktokFollowing, forYou: p.tiktokForYou }}
                noImageLabel={p.noImage}
              />
            </div>
            <p className="mt-4 text-center text-xs text-on-surface-variant">{p.previewHint}</p>
          </SectionCard>

          {/* Source material */}
          <SectionCard title={p.fabricCardTitle} icon={FileText}>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{p.fabricCardFabric}</p>
                  <p className="mt-1 truncate font-heading text-base font-bold text-on-surface">{detail.fabricTitle ?? '—'}</p>
                </div>
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.fabricSku ? (
                  <span className="rounded-md bg-surface-container-high px-2 py-1 font-mono text-xs text-on-surface">{p.fabricCardSku}: {detail.fabricSku}</span>
                ) : null}
                <span className="rounded-md bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
                  {p.fabricCardSupplier}: {detail.supplierName ?? '—'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Social score */}
          <SectionCard title={p.engagementCardTitle} icon={TrendingUp}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-extrabold tabular-nums text-primary">
                {detail.socialScore ?? '—'}
              </div>
              <p className="text-sm text-on-surface-variant">{p.engagementCardHint}</p>
            </div>
          </SectionCard>
        </section>

        {/* ══ Right column: editor + breakdown + deploy ═══════════ */}
        <section className="space-y-6 xl:col-span-7">
          {/* Refine content */}
          <SectionCard title={p.contentEditorTitle} icon={Wand2} action={<Badge intent="brand">{p.campaignAi}</Badge>}>
            {postTitle ? (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{p.postTitleLabel}</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{postTitle}</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor={`social-caption-${postId}`}>
                    {p.captionLabel}
                  </label>
                  <span className="font-mono text-[10px] tabular-nums text-on-surface-variant">{caption.length}</span>
                </div>
                <Textarea
                  id={`social-caption-${postId}`}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[150px] rounded-xl border-outline/15 bg-surface-container-high"
                />
              </div>

              <div>
                <span className="text-sm font-semibold text-on-surface-variant">{p.hashtagsLabel}</span>
                {tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                      >
                        {t}
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-on-surface-variant">{p.hashtagsLabel} —</p>
                )}
                <div className="mt-2 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onAddTag()
                      }
                    }}
                    placeholder="#sustainable"
                    className="rounded-xl border-outline/15"
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={onAddTag} aria-label="Add hashtag">
                    +
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* AI breakdown */}
          <SectionCard title={p.aiBreakdownTitle} icon={Sparkles} action={<Badge intent="brand">{p.campaignAi}</Badge>}>
            {!hasAiBreakdown ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline/20 py-10 text-center">
                <Sparkles className="h-6 w-6 text-on-surface-variant" aria-hidden />
                <p className="max-w-xs text-sm text-on-surface-variant">{p.emptyBreakdown}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {specificationsSummary ? (
                  <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <FileText className="h-3 w-3" aria-hidden /> {p.specsTitle}
                    </span>
                    <p className="mt-1.5 whitespace-pre-line font-mono text-xs text-on-surface">{specificationsSummary}</p>
                  </div>
                ) : null}

                {(callToAction || targetAudience) ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {callToAction ? (
                      <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Megaphone className="h-3 w-3" aria-hidden /> {p.ctaTitle}
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-on-surface">{callToAction}</p>
                      </div>
                    ) : null}
                    {targetAudience ? (
                      <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Target className="h-3 w-3" aria-hidden /> {p.audienceTitle}
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-on-surface">{targetAudience}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {keyFeatures.length > 0 ? (
                  <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <TrendingUp className="h-3 w-3" aria-hidden /> {p.featuresTitle}
                    </span>
                    <ul className="mt-2 space-y-1.5 text-xs text-on-surface">
                      {keyFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(imageOverlayText || imagePrompt || carouselSlides.length > 0) ? (
                  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Palette className="h-3 w-3" aria-hidden /> {p.visualTitle}
                    </span>

                    {imageOverlayText ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-on-surface-variant">{p.overlayLabel}</span>
                        <p className="mt-0.5 text-xs font-semibold italic text-on-surface">{imageOverlayText}</p>
                      </div>
                    ) : null}

                    {imagePrompt ? (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">{p.promptLabel}</span>
                          <RegenInlineButton
                            label={p.regenerateImage}
                            pendingLabel={p.regenerating}
                            pending={regenerateImage.isPending}
                            onClick={() => regenerateImage.mutate(undefined)}
                          />
                        </div>
                        <p className="mt-1 rounded-lg border border-outline/10 bg-surface-container-lowest p-2 font-mono text-xs text-on-surface">{imagePrompt}</p>
                      </div>
                    ) : null}

                    {carouselSlides.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">{p.carouselLabel}</span>
                          <RegenInlineButton
                            label={p.regenerateCarousel}
                            pendingLabel={p.regenerating}
                            pending={regenerateCarousel.isPending}
                            onClick={() => regenerateCarousel.mutate(undefined)}
                          />
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          {carouselSlides.map((slide, idx) => (
                            <div key={idx} className="rounded-lg border border-outline/10 bg-surface-container-lowest p-2.5 text-xs">
                              <span className="font-bold text-primary">{p.slideTitle} {slide.slideNumber || idx + 1}: {slide.title}</span>
                              <p className="mt-0.5 text-[11px] text-on-surface-variant">{slide.imageDescription}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {detail.scriptText ? (
                  <div className="rounded-xl border border-outline/10 bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Clapperboard className="h-3 w-3" aria-hidden /> {p.scriptLabel}
                      </span>
                      <RegenInlineButton
                        label={p.regenerateReel}
                        pendingLabel={p.regenerating}
                        pending={regenerateReel.isPending}
                        onClick={() => regenerateReel.mutate(undefined)}
                      />
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-xs text-on-surface">{detail.scriptText}</p>
                  </div>
                ) : null}
              </div>
            )}
          </SectionCard>

          {/* Deployment */}
          <SectionCard title={p.deploymentTitle2} icon={CalendarClock}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor={`social-when-${postId}`}>
                  {p.scheduleDate} / {p.scheduleTime}
                </label>
                <Input
                  id={`social-when-${postId}`}
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                  className="mt-2 rounded-xl border-outline/15 bg-surface-container-high"
                />
                <p className="mt-2 text-xs text-on-surface-variant">{p.optimalHint}</p>
                {recommendedPostingTime ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {p.suggestedTimeLabel}: {recommendedPostingTime}
                  </div>
                ) : null}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{p.platformTitle}</p>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-outline/10 bg-surface-container-low px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-semibold text-on-surface">{detail.platform}</span>
                  </div>
                  <Badge intent="brand">{contentType}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Code2 className="h-3.5 w-3.5" aria-hidden />
                  {p.syncTitle}: <span className="font-mono font-semibold text-on-surface">{detail.platform}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="h-12 flex-1 rounded-2xl" onClick={onSave} disabled={patchPost.isPending}>
                {p.saveDraft}
              </Button>
              <Button type="button" className="h-12 flex-[2] rounded-2xl shadow-lg" onClick={onSchedule} disabled={schedule.isPending}>
                {p.approveSchedule}
              </Button>
            </div>
          </SectionCard>
        </section>
      </div>

      {/* ── Sticky action bar ───────────────────────────────────── */}
      <footer
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-3 border-t border-outline/15 bg-background/95 py-4 backdrop-blur md:left-[var(--admin-sidebar-width)] md:flex-row md:items-center md:justify-between',
          ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS
        )}
      >
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Badge className={cn(statusBadgeClass)}>{statusLabel[detail.status] ?? detail.status}</Badge>
          <span className="hidden sm:inline">
            {p.syncTitle}: <span className="font-mono font-semibold text-on-surface">{detail.platform}</span> · {p.idShort} {detail.id}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onReject} disabled={reject.isPending}>
            {p.rejectPost}
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => publish.mutate()} disabled={publish.isPending}>
            {p.publishNow}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export function AdminSocialPreviewClient({ postId }: { postId: number }) {
  const router = useRouter()
  const { messages } = useI18n()
  const p = messages.admin.socialPreviewPage

  const query = useAdminSocialPost(postId)
  const mutations = useAdminSocialPostMutations(postId)

  const detail = query.data?.success ? query.data.data : undefined

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-outline/15 bg-surface-container-low p-8 text-center">
        <p className="text-sm text-destructive">{query.error.message}</p>
        <Button type="button" className="mt-4 rounded-xl" variant="outline" asChild>
          <Link href="/admin/social">{p.back}</Link>
        </Button>
      </div>
    )
  }

  if (query.isLoading || !detail) {
    return (
      <div className="space-y-8 pb-40">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="mx-auto aspect-[9/16] w-[320px] max-w-full animate-pulse rounded-[2rem] bg-surface-container-high" />
          </div>
          <div className="space-y-4 lg:col-span-7">
            <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="h-32 animate-pulse rounded-2xl bg-surface-container-high" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-40">
      <SocialPreviewBody
        key={`${postId}-${query.dataUpdatedAt}`}
        detail={detail}
        postId={postId}
        p={p}
        patchPost={mutations.patchPost}
        schedule={mutations.schedule}
        reject={mutations.reject}
        publish={mutations.publish}
        regenerateCarousel={mutations.regenerateCarousel}
        regenerateImage={mutations.regenerateImage}
        regenerateReel={mutations.regenerateReel}
        router={router}
      />
    </div>
  )
}
