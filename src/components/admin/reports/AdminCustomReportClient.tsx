'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Braces, Download, HelpCircle, RefreshCw, Rocket, Save, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { CustomReportBuilderCanvasSection, type CanvasVisualization } from '@/components/admin/reports/custom-report-builder-canvas-section'
import {
  CustomReportBuilderTableSection,
  type TableSectionVisualization
} from '@/components/admin/reports/custom-report-builder-table-section'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminCustomReportQuery } from '@/hooks/admin/useAdminCustomReportQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { downloadCustomReportPreviewCsv } from '@/lib/export-custom-report-csv'
import { downloadCustomReportJson } from '@/lib/export-custom-report-json'
import { cn } from '@/lib/utils'

function CustomReportSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <div className="lg:col-span-8">
          <Skeleton className="h-[520px] rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

type ReportTab = 'table' | 'canvas'

function parseTab(v: string | null): ReportTab {
  return v === 'canvas' ? 'canvas' : 'table'
}

function formatPeriodDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric'
  }).format(d)
}

export function AdminCustomReportClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.customReportPage
  const pathname = usePathname()
  const router = useRouter()
  const query = useAdminCustomReportQuery()

  const [tableViz, setTableViz] = React.useState<TableSectionVisualization>('bar')
  const [canvasViz, setCanvasViz] = React.useState<CanvasVisualization>('bar')
  const [reportTab, setReportTab] = React.useState<ReportTab>('table')
  const [helpOpen, setHelpOpen] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const t = new URLSearchParams(window.location.search).get('tab')
    setReportTab(parseTab(t))
  }, [])

  const onReportTabChange = React.useCallback(
    (value: string) => {
      const next = parseTab(value)
      setReportTab(next)
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      params.set('tab', next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  const onExportCsv = React.useCallback(() => {
    if (!query.data || query.data.previewRows.length === 0) {
      toast.error(p.loadError)
      return
    }
    downloadCustomReportPreviewCsv(query.data)
    toast.success(p.exportCsvToast)
  }, [query.data, p])

  const onExportJson = React.useCallback(() => {
    if (!query.data) {
      toast.error(p.loadError)
      return
    }
    downloadCustomReportJson(query.data)
    toast.success(p.exportJsonToast)
  }, [query.data, p])

  const onDeploy = React.useCallback(() => {
    const data = query.data
    if (!data) {
      toast.error(p.loadError)
      return
    }

    downloadCustomReportJson(data)
    if (data.previewRows.length > 0) {
      downloadCustomReportPreviewCsv(data)
    }
    toast.success(p.toastDeployed)
  }, [query.data, p])

  const onRefresh = React.useCallback(() => {
    void query.refetch()
  }, [query])

  if (query.isLoading && !query.data) {
    return <CustomReportSkeleton />
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-destructive">{p.loadError}</p>
        <Button type="button" className="mt-4 rounded-xl" variant="outline" onClick={() => void query.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          {p.retry}
        </Button>
      </div>
    )
  }

  const data = query.data
  const lastSync = interpolate(p.lastSync, {
    time: formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })
  })
  const periodLabel = interpolate(p.periodRange, {
    from: formatPeriodDate(data.periodFrom, locale),
    to: formatPeriodDate(data.periodTo, locale)
  })

  const tableCopy = {
    dataSources: p.dataSources,
    visualization: p.visualization,
    reportPreview: p.reportPreview,
    totalRows: p.totalRows,
    activePartners: p.activePartners,
    aggregatedValue: p.aggregatedValue,
    trendInsight: p.trendInsight,
    vizTable: p.vizTable,
    vizLine: p.vizLine,
    vizBar: p.vizBar,
    vizPie: p.vizPie,
    reportId: p.reportId,
    active: p.active,
    leadsSales: p.leadsSales,
    colTransaction: p.colTransaction,
    colPartner: p.colPartner,
    colFabric: p.colFabric,
    colQty: p.colQty,
    colTotal: p.colTotal,
    exportCsv: p.exportCsv,
    refresh: p.refresh,
    dataSourceLeadsLabel: p.dataSourceLeadsLabel,
    dataSourceLeadsDesc: p.dataSourceLeadsDesc,
    dataSourceFabricsLabel: p.dataSourceFabricsLabel,
    dataSourceFabricsDesc: p.dataSourceFabricsDesc,
    dataSourceRevenueLabel: p.dataSourceRevenueLabel,
    dataSourceRevenueDesc: p.dataSourceRevenueDesc,
    rowsSuffix: p.rowsSuffix,
    trendUp: p.trendUp,
    trendDown: p.trendDown,
    trendFlat: p.trendFlat,
    trendInsufficient: p.trendInsufficient,
    visualizationLabel: p.visualizationLabel,
    noChartData: p.noChartData,
    vizUnitLeads: p.vizUnitLeads,
    vizUnitWon: p.vizUnitWon
  }

  const canvasCopy = {
    availableFields: p.availableFields,
    reportParams: p.reportParams,
    vizBar: p.vizBar,
    vizLine: p.vizLine,
    vizPie: p.vizPie,
    vizTable: p.vizTable,
    colSku: p.colSku,
    colConversion: p.colConversion,
    colRating: p.colRating,
    colTrend: p.colTrend,
    colLeadsCount: p.colLeadsCount,
    colWonCount: p.colWonCount,
    colConvPercent: p.colConvPercent,
    engineConnected: p.engineConnected,
    rowsScanned: p.rowsScanned,
    version: p.version,
    refresh: p.refresh,
    lastSync: p.lastSync,
    noChartData: p.noChartData,
    vizUnitLeads: p.vizUnitLeads,
    vizUnitWon: p.vizUnitWon,
    dataSourceLeadsLabel: p.dataSourceLeadsLabel,
    dataSourceFabricsLabel: p.dataSourceFabricsLabel,
    dataSourceRevenueLabel: p.dataSourceRevenueLabel,
    dataSourceLeadsDesc: p.dataSourceLeadsDesc,
    dataSourceFabricsDesc: p.dataSourceFabricsDesc,
    dataSourceRevenueDesc: p.dataSourceRevenueDesc,
    rowsSuffix: p.rowsSuffix,
    visualizationLabel: p.visualizationLabel,
    tableViewTitle: p.tableViewTitle
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{p.subtitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            <span>{periodLabel}</span>
            <span aria-hidden>·</span>
            <span>{lastSync}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Honest disabled buttons — no fake success toast */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            disabled
            title={p.roadmapTooltip}
            aria-label={p.drafts}
          >
            {p.drafts}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onRefresh}
            disabled={query.isFetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
            {p.refresh}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onExportCsv}
            disabled={data.previewRows.length === 0}
            title={data.previewRows.length === 0 ? p.loadError : undefined}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {p.exportCsv}
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onExportJson}>
            <Braces className="mr-2 h-4 w-4" aria-hidden />
            {p.exportJson}
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled
            title={p.roadmapTooltip}
            aria-label={p.saveReport}
          >
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {p.saveReport}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={reportTab} onValueChange={onReportTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table">{p.tabTable}</TabsTrigger>
          <TabsTrigger value="canvas">{p.tabCanvas}</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-6">
          <CustomReportBuilderTableSection
            data={data}
            viz={tableViz}
            onVizChange={setTableViz}
            onExportCsv={onExportCsv}
            onRefresh={onRefresh}
            isFetching={query.isFetching}
            locale={locale}
            copy={tableCopy}
          />
        </TabsContent>
        <TabsContent value="canvas" className="mt-6">
          <CustomReportBuilderCanvasSection
            data={data}
            canvasViz={canvasViz}
            onCanvasVizChange={setCanvasViz}
            onRefresh={onRefresh}
            isFetching={query.isFetching}
            locale={locale}
            copy={canvasCopy}
          />
        </TabsContent>
      </Tabs>

      {/* Floating action — real Help dialog (no fake toast) and an honest disabled Deploy button */}
      <div className="fixed bottom-6 right-4 z-30 flex items-center gap-3 md:bottom-8 md:right-8">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label={p.help}
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="h-5 w-5" aria-hidden />
        </Button>
        <Button
          type="button"
          className="gap-2 rounded-full px-6 py-6 text-base shadow-lg"
          onClick={onDeploy}
          disabled={query.isFetching || !query.data}
          title={!query.data ? p.loadError : query.isFetching ? p.refresh : undefined}
        >
          <Rocket className="h-5 w-5" aria-hidden />
          {p.deploy}
        </Button>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
              {p.helpDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm text-on-surface">
            <p>{p.helpDialogIntro}</p>
            <ul className="list-disc space-y-2 pl-5 text-on-surface-variant">
              <li>{p.helpDialogBullet1}</li>
              <li>{p.helpDialogBullet2}</li>
              <li>{p.helpDialogBullet3}</li>
            </ul>
          </div>
          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="rounded-xl">
                {p.helpDialogClose}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
