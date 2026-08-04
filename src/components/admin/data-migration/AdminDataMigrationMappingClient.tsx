'use client'

import Link from 'next/link'
import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Beaker,
  CheckCircle2,
  ExternalLink,
  Inbox,
  RefreshCw,
  Sparkles,
  Workflow,
  Zap
} from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass } from '@/components/admin/dashboard-stat-card-tones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminDataMigrationMappingQuery } from '@/hooks/admin/useAdminDataMigrationMappingQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { PipelineRuleTransformKind, PipelineStage } from '@/lib/data-migration-pipeline-rules'
import type { DataMigrationColumnKind } from '@/types/admin-data-migration-mapping.types'
import type { Locale } from '@/types/i18n.types'

function localeFor(loc: Locale): string {
  return loc === 'ru' ? 'ru-RU' : loc === 'zh' ? 'zh-CN' : 'en-US'
}

function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFor(locale)).format(n)
}

function formatDateTime(iso: string | null, locale: Locale): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(localeFor(locale), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

type Copy = ReturnType<typeof useI18n>['messages']['admin']['dataMigrationPage']

function kindLabel(kind: DataMigrationColumnKind, p: Copy): string {
  switch (kind) {
    case 'string':
      return p.kindString
    case 'number':
      return p.kindNumber
    case 'boolean':
      return p.kindBoolean
    case 'timestamp':
      return p.kindTimestamp
    case 'array':
      return p.kindArray
    case 'json':
      return p.kindJson
    case 'enum':
      return p.kindEnum
    case 'other':
    default:
      return p.kindOther
  }
}

function kindBadgeClasses(kind: DataMigrationColumnKind): string {
  switch (kind) {
    case 'string':
      return 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
    case 'number':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
    case 'boolean':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'timestamp':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
    case 'array':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'json':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200'
    case 'enum':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function transformLabel(transform: PipelineRuleTransformKind, p: Copy): string {
  switch (transform) {
    case 'CRAWLER_DIRECT_COPY':
      return p.transformCrawlerDirectCopy
    case 'CRAWLER_PRESERVE_RAW':
      return p.transformCrawlerPreserveRaw
    case 'CRAWLER_COPY_IMAGES':
      return p.transformCrawlerCopyImages
    case 'AI_TRANSLATE_EN':
      return p.transformAiTranslateEn
    case 'AI_GENERATE_DESCRIPTION_EN':
      return p.transformAiGenerateDescriptionEn
    case 'AI_GENERATE_SEO_META':
      return p.transformAiGenerateSeoMeta
    case 'AI_CLASSIFY_FABRIC_TYPE':
      return p.transformAiClassifyFabricType
    case 'AI_EXTRACT_NUMBER':
      return p.transformAiExtractNumber
    case 'AI_NORMALIZE_PRICE':
      return p.transformAiNormalizePrice
    case 'AI_PARSE_COMPOSITION':
      return p.transformAiParseComposition
    case 'AI_EXTRACT_TAGS':
      return p.transformAiExtractTags
    case 'AI_SET_CONFIDENCE':
      return p.transformAiSetConfidence
    case 'AI_SET_TIMESTAMP':
      return p.transformAiSetTimestamp
    case 'AI_TRANSITION_STATUS':
      return p.transformAiTransitionStatus
    default: {
      const _exhaustive: never = transform
      return _exhaustive
    }
  }
}

function stageBadgeClasses(stage: PipelineStage): string {
  return stage === 'CRAWLER'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    : 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
}

function stageLabel(stage: PipelineStage, p: Copy): string {
  return stage === 'CRAWLER' ? p.pipelineStageCrawler : p.pipelineStageAi
}

function statusBadgeClasses(status: string | null): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'RUNNING':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'PENDING':
      return 'bg-brand-100 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function MappingSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-surface-container-highest" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-container-highest" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[480px] animate-pulse rounded-xl bg-surface-container-highest lg:col-span-3" />
        <div className="h-[480px] animate-pulse rounded-xl bg-surface-container-highest lg:col-span-6" />
        <div className="h-[480px] animate-pulse rounded-xl bg-surface-container-highest lg:col-span-3" />
      </div>
    </div>
  )
}

type StageFilter = 'all' | PipelineStage

export function AdminDataMigrationMappingClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.dataMigrationPage
  const query = useAdminDataMigrationMappingQuery()

  const [sourceFilter, setSourceFilter] = React.useState('')
  const [targetFilter, setTargetFilter] = React.useState('')
  const [stageFilter, setStageFilter] = React.useState<StageFilter>('all')

  const d = query.data
  const sourceColumns = React.useMemo(() => d?.sourceColumns ?? [], [d])
  const targetColumns = React.useMemo(() => d?.targetColumns ?? [], [d])
  const pipelineRules = React.useMemo(() => d?.pipelineRules ?? [], [d])
  const sampleRawProducts = React.useMemo(() => d?.sampleRawProducts ?? [], [d])

  const filteredSourceColumns = React.useMemo(() => {
    const q = sourceFilter.trim().toLowerCase()
    if (!q) return sourceColumns
    return sourceColumns.filter((c) => c.name.toLowerCase().includes(q))
  }, [sourceColumns, sourceFilter])

  const filteredTargetColumns = React.useMemo(() => {
    const q = targetFilter.trim().toLowerCase()
    if (!q) return targetColumns
    return targetColumns.filter((c) => c.name.toLowerCase().includes(q))
  }, [targetColumns, targetFilter])

  const filteredPipelineRules = React.useMemo(() => {
    if (stageFilter === 'all') return pipelineRules
    return pipelineRules.filter((r) => r.stage === stageFilter)
  }, [pipelineRules, stageFilter])

  if (query.isLoading && !d) {
    return <MappingSkeleton />
  }

  if (query.isError || !d) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-destructive">{p.mappingLoadError}</p>
        <Button type="button" className="mt-4 rounded-xl" variant="outline" onClick={() => void query.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          {p.retry}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{p.subtitle}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            {interpolate(p.lastSync, { time: formatDistanceToNow(new Date(d.generatedAt), { addSuffix: true }) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
            {p.refresh}
          </Button>
          <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
            <Link href={withLocaleUrl('/admin/crawler/control', locale)}>
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              {p.goToCrawler}
            </Link>
          </Button>
          <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
            <Link href={withLocaleUrl('/admin/catalog-import-sync', locale)}>
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              {p.goToCatalogImport}
            </Link>
          </Button>
        </div>
      </header>

      {/* KPI strip — REAL ingest funnel from fabrics.status */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardStatCardShell tone="blue">
          <div className="flex items-start justify-between">
            <p className={dashboardStatLabelClass}>{p.kpiRawScraped}</p>
            <Inbox className="h-4 w-4 text-brand-600" aria-hidden />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-on-surface">
            {formatNumber(d.stats.rawScraped, locale)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{p.kpiRawScrapedHint}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            {interpolate(p.ingestedLast24hLabel, { n: formatNumber(d.stats.ingestedLast24h, locale) })}
          </p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="yellow">
          <div className="flex items-start justify-between">
            <p className={dashboardStatLabelClass}>{p.kpiAiProcessing}</p>
            <Workflow className="h-4 w-4 text-amber-600" aria-hidden />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-on-surface">
            {formatNumber(d.stats.aiProcessing, locale)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{p.kpiAiProcessingHint}</p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="blue">
          <div className="flex items-start justify-between">
            <p className={dashboardStatLabelClass}>{p.kpiAiProcessed}</p>
            <Zap className="h-4 w-4 text-violet-600" aria-hidden />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-on-surface">
            {formatNumber(d.stats.aiProcessed, locale)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{p.kpiAiProcessedHint}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            {interpolate(p.aiProcessedLast24hLabel, { n: formatNumber(d.stats.aiProcessedLast24h, locale) })}
          </p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="green">
          <div className="flex items-start justify-between">
            <p className={dashboardStatLabelClass}>{p.kpiApproved}</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-on-surface">
            {formatNumber(d.stats.approved, locale)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{p.kpiApprovedHint}</p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="red">
          <p className={dashboardStatLabelClass}>{p.kpiErrors7d}</p>
          <p
            className={cn(
              'mt-2 font-mono text-2xl font-black tabular-nums',
              d.stats.crawlerErrorsLast7d > 0 ? 'text-red-700 dark:text-red-400' : 'text-on-surface'
            )}
          >
            {formatNumber(d.stats.crawlerErrorsLast7d, locale)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{p.kpiErrors7dHint}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            {interpolate(p.crawlerRunsLast7dLabel, { n: formatNumber(d.stats.crawlerRunsLast7d, locale) })}
          </p>
        </DashboardStatCardShell>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Source columns */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{p.sourceSchemaTitle}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">{p.sourceSchemaSubtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                {sourceColumns.length}
              </span>
            </div>
            <Input
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              placeholder={p.columnSearchPlaceholder}
              className="h-9 text-sm"
              type="search"
              aria-label={p.columnSearchPlaceholder}
            />

            <div className="mt-4">
              {filteredSourceColumns.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
                  {p.emptySourceFields}
                </p>
              ) : (
                <ul className="max-h-[480px] space-y-2 overflow-auto pr-1">
                  {filteredSourceColumns.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold text-on-surface">{c.name}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">
                          {c.notNull ? p.colNotNull : p.colNullable}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
                          kindBadgeClasses(c.kind)
                        )}
                      >
                        {kindLabel(c.kind, p)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Target columns */}
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{p.targetSchemaTitle}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">{p.targetSchemaSubtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                {targetColumns.length}
              </span>
            </div>
            <Input
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              placeholder={p.columnSearchPlaceholder}
              className="h-9 text-sm"
              type="search"
              aria-label={p.columnSearchPlaceholder}
            />
            <div className="mt-4">
              {filteredTargetColumns.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
                  {p.emptySourceFields}
                </p>
              ) : (
                <ul className="max-h-[400px] space-y-2 overflow-auto pr-1">
                  {filteredTargetColumns.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold text-on-surface">{c.name}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">
                          {c.notNull ? p.colNotNull : p.colNullable}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
                          kindBadgeClasses(c.kind)
                        )}
                      >
                        {kindLabel(c.kind, p)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline rules */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline/10 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-on-surface">{p.pipelineTitle}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">{p.pipelineSubtitle}</p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  {interpolate(p.pipelineCountLabel, { n: pipelineRules.length.toString() })}
                </span>
              </div>

              {/* Stage filter chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(['all', 'CRAWLER', 'AI_WORKER'] as const).map((s) => {
                  const isActive = stageFilter === s
                  const label =
                    s === 'all'
                      ? p.pipelineFilterAll
                      : s === 'CRAWLER'
                        ? p.pipelineStageCrawler
                        : p.pipelineStageAi
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStageFilter(s)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold transition-colors',
                        isActive
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 pt-4">
              {/* Header row matches body grid: stage / source / target / required */}
              <div className="hidden grid-cols-12 gap-2 border-b border-outline/10 pb-2 text-[10px] font-bold uppercase tracking-wide text-outline sm:grid">
                <div className="col-span-2">{p.pipelineTransformLabel}</div>
                <div className="col-span-4">{p.pipelineSourceLabel}</div>
                <div className="col-span-4">{p.pipelineTargetLabel}</div>
                <div className="col-span-2 text-right">{p.pipelineRequired}</div>
              </div>

              <ul className="mt-3 max-h-[640px] space-y-2 overflow-auto pr-1">
                {filteredPipelineRules.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-outline/20 p-6 text-center text-xs text-on-surface-variant">
                    {p.emptySourceFields}
                  </li>
                ) : (
                  filteredPipelineRules.map((r) => (
                    <li key={r.id} className="rounded-xl bg-surface-container-low p-3">
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-12 sm:col-span-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                              stageBadgeClasses(r.stage)
                            )}
                          >
                            {stageLabel(r.stage, p)}
                          </span>
                        </div>
                        <div className="col-span-12 min-w-0 sm:col-span-4">
                          <p className="truncate font-mono text-xs font-semibold text-on-surface">{r.sourceColumn}</p>
                        </div>
                        <div className="col-span-12 min-w-0 sm:col-span-4">
                          <p className="truncate font-mono text-xs font-semibold text-on-surface">{r.targetColumn}</p>
                        </div>
                        <div className="col-span-12 flex sm:col-span-2 sm:justify-end">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold',
                              r.optional
                                ? 'bg-surface-container-high text-on-surface-variant'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                            )}
                          >
                            {r.optional ? p.pipelineOptional : p.pipelineRequired}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">{transformLabel(r.transform, p)}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Latest run + sample rows */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Beaker className="h-5 w-5 text-amber-700" aria-hidden />
              <h3 className="text-sm font-bold text-on-surface">{p.latestRunTitle}</h3>
            </div>

            {d.latestRun.id === null ? (
              <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
                {p.latestRunNone}
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-outline">
                    {interpolate(p.latestRunIdLabel, { id: String(d.latestRun.id) })}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider',
                      statusBadgeClasses(d.latestRun.status)
                    )}
                  >
                    {d.latestRun.status ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunSource}</span>
                  <span className="font-mono font-bold text-on-surface">{d.latestRun.source ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunFound}</span>
                  <span className="font-mono font-bold tabular-nums text-on-surface">
                    {formatNumber(d.latestRun.productsFound, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunSaved}</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatNumber(d.latestRun.productsSaved, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunErrors}</span>
                  <span
                    className={cn(
                      'font-mono font-bold tabular-nums',
                      d.latestRun.errorsCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-on-surface'
                    )}
                  >
                    {formatNumber(d.latestRun.errorsCount, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunStarted}</span>
                  <span className="font-mono font-bold text-on-surface">
                    {formatDateTime(d.latestRun.startedAt, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunCompleted}</span>
                  <span className="font-mono font-bold text-on-surface">
                    {formatDateTime(d.latestRun.completedAt, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{p.latestRunDuration}</span>
                  <span className="font-mono font-bold text-on-surface">
                    {d.latestRun.durationSeconds == null
                      ? '—'
                      : interpolate(p.durationSeconds, { n: d.latestRun.durationSeconds })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sample raw fabrics */}
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-on-surface">{p.sampleRowsTitle}</h3>
              <p className="mt-1 text-xs text-on-surface-variant">{p.sampleRowsSubtitle}</p>
            </div>
            {sampleRawProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
                {p.sampleRowsEmpty}
              </p>
            ) : (
              <ul className="space-y-3">
                {sampleRawProducts.map((r) => (
                  <li key={r.id} className="rounded-xl border border-outline/10 bg-surface-container-low p-3">
                    <Link
                      href={withLocaleUrl(`/admin/fabrics/${r.id}`, locale)}
                      className="block truncate text-xs font-bold text-on-surface hover:text-primary"
                      title={r.titleRu}
                    >
                      {r.titleRu}
                    </Link>
                    {r.rawTitle && r.rawTitle !== r.titleRu ? (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-outline">{r.rawTitle}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-outline">{p.sampleRowSource}:</span>
                        <span className="font-mono">{r.supplierName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-outline">{p.sampleRowCreated}:</span>
                        <span className="font-mono">{formatDateTime(r.createdAt, locale)}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-outline">
                        #{r.id}
                      </span>
                      <Button asChild type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px]">
                        <Link href={withLocaleUrl(`/admin/fabrics/${r.id}`, locale)}>
                          <ExternalLink className="h-3 w-3" aria-hidden />
                          {p.openFabric}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
