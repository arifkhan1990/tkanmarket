'use client'

import * as React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { ArrowLeft, Download, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from '@/hooks/useI18n'
import { fillMessage } from '@/lib/i18n/fill-message'
import type { BulkFabricRowInput } from '@/types/admin-fabric-management.types'

const CHUNK_SIZE = 200
const PREVIEW_ROWS = 20

const EXPECTED_COLUMNS = [
  'title_ru',
  'title_en',
  'fabric_type',
  'gsm',
  'width_cm',
  'price_usd',
  'moq',
  'tags',
  'supplier_name'
] as const

type ImportPhase = 'upload' | 'sheet' | 'preview' | 'importing' | 'done'

interface SheetInfo {
  name: string
  rowCount: number
}

interface ImportResult {
  created: number
  failed: number
}

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

const COLUMN_ALIAS: Record<string, string> = {
  'product_name': 'title_ru',
  'product_name_ru': 'title_ru',
  'наименование': 'title_ru',
  'product_name_en': 'title_en',
  'product_type': 'fabric_type',
  'тип_ткани': 'fabric_type',
  'composition': 'composition_raw',
  'composition_/_material': 'composition_raw',
  'состав': 'composition_raw',
  'weight': 'gsm',
  'weight_(гр.м2)': 'gsm',
  'вес': 'gsm',
  'вес_(гр.м2)': 'gsm',
  'width': 'width_cm',
  'width_(см)': 'width_cm',
  'ширина': 'width_cm',
  'ширина_(см)': 'width_cm',
  'use': 'usage_ru',
  'назначение': 'usage_ru',
  'color': 'color',
  'цвет': 'color',
  'supply_type': 'supply_type',
  'тип_поставки': 'supply_type',
  'shipment_time': 'shipment_time',
  'срок_поставки': 'shipment_time',
  'hero_image': 'hero_image',
  'hero image': 'hero_image',
  'image_1': 'image_1',
  'image 1': 'image_1',
  'image_2': 'image_2',
  'image 2': 'image_2',
  'image_3': 'image_3',
  'image 3': 'image_3',
  'image_4': 'image_4',
  'image 4': 'image_4',
  'supplier': 'supplier_name',
  'supplier_name': 'supplier_name',
  'поставщик': 'supplier_name',
  'sku': 'sku',
  'sku_/_item_number': 'sku'
}

function toStringOrNull(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null
  return String(val).trim() || null
}

function convertGoogleDriveUrl(url: string): string {
  // Convert Google Drive share URL to direct image URL
  // Formats: /file/d/FILE_ID/view, /file/d/FILE_ID/, /uc?id=FILE_ID, /open?id=FILE_ID
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://drive.google.com/uc?id=${match[1]}`
  }
  // Already direct or other format
  return url
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function toIntOrNull(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.round(n)
}

function parseTags(val: unknown): string[] | null {
  if (val === undefined || val === null || val === '') return null
  const parts = String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : null
}

function parseSheet(workbook: XLSX.WorkBook, sheetName: string): { headers: string[]; rows: BulkFabricRowInput[] } | { error: string } {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return { error: 'empty' }

  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (rawData.length === 0) return { error: 'empty' }

  const rawHeaders = Object.keys(rawData[0] as Record<string, unknown>)
  const rawToAlias = new Map<string, string>()
  for (const raw of rawHeaders) {
    const normalized = normalizeHeader(raw)
    rawToAlias.set(raw, COLUMN_ALIAS[normalized] ?? normalized)
  }

  const aliasToRaw = new Map<string, string>()
  for (const [raw, alias] of rawToAlias) {
    if (!aliasToRaw.has(alias)) aliasToRaw.set(alias, raw)
  }

  if (!aliasToRaw.has('title_ru')) {
    if (aliasToRaw.has('composition_raw')) {
      return { error: 'missing_title_ru' }
    }
    return { error: 'missing_title_ru' }
  }

  const headers = rawHeaders.map((r) => rawToAlias.get(r) ?? normalizeHeader(r))
  const rows: BulkFabricRowInput[] = []

  for (const record of rawData) {
    const values = Object.values(record as Record<string, unknown>)
    const hasData = values.some((v) => v !== null && v !== undefined && v !== '')
    if (!hasData) continue

    const get = (col: string): unknown => {
      const originalKey = aliasToRaw.get(col)
      if (!originalKey) return null
      return record[originalKey]
    }

    const titleRu = toStringOrNull(get('title_ru'))
    if (!titleRu || titleRu.length < 2) continue

    const images: string[] = []
    for (const imgField of ['hero_image', 'image_1', 'image_2', 'image_3', 'image_4'] as const) {
      const url = toStringOrNull(get(imgField))
      if (url) images.push(url)
    }

    rows.push({
      title_ru: titleRu,
      title_en: toStringOrNull(get('title_en')),
      fabric_type: toStringOrNull(get('fabric_type')),
      gsm: toIntOrNull(get('gsm')),
      width_cm: toIntOrNull(get('width_cm')),
      price_usd: toStringOrNull(get('price_usd')),
      moq: toIntOrNull(get('moq')),
      tags: parseTags(get('tags')),
      supplier_name: toStringOrNull(get('supplier_name')),
      usage_ru: toStringOrNull(get('usage_ru')),
      description_ru: toStringOrNull(get('description_ru')),
      color: toStringOrNull(get('color')),
      supply_type: toStringOrNull(get('supply_type')),
      shipment_time: toStringOrNull(get('shipment_time')),
      images: (() => {
        const imgs: string[] = []
        for (const field of ['hero_image', 'image_1', 'image_2', 'image_3', 'image_4'] as const) {
          const v = get(field)
          if (v) {
            const url = convertGoogleDriveUrl(String(v).trim())
            if (isValidUrl(url)) imgs.push(url)
          }
        }
        return imgs.length > 0 ? imgs : null
      })(),
      sku: toStringOrNull(get('sku'))
    })
  }

  return { headers, rows }
}

function getSheetInfos(buffer: ArrayBuffer): { workbook: XLSX.WorkBook; sheets: SheetInfo[] } | { error: string } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheets: SheetInfo[] = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name]
      const ref = sheet?.['!ref']
      const rowCount = ref ? XLSX.utils.decode_range(ref).e.r : 0
      return { name, rowCount }
    })
    return { workbook, sheets }
  } catch {
    return { error: 'parse_failed' }
  }
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    EXPECTED_COLUMNS.slice(),
    ['Хлопковая ткань', 'Cotton fabric', 'woven', 200, 150, '3.50', 500, 'cotton, premium', ''],
    ['Полиэстер стрейч', 'Polyester stretch', 'knit', 180, 140, '2.10', 1000, 'polyester, stretch', '']
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'fabrics')
  XLSX.writeFile(wb, 'fabric-import-template.xlsx')
}

interface SendChunkResult {
  ids: number[]
  rawStored?: number
}

async function sendChunk(
  rows: BulkFabricRowInput[]
): Promise<SendChunkResult> {
  const res = await fetch('/api/v1/admin/fabrics/bulk-create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows })
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    const msg = json.error?.message ?? 'Chunk import failed'
    const details = json.error?.details
    console.error('Bulk import chunk failed:', msg, details ? JSON.stringify(details) : '')
    throw new Error(msg)
  }
  return json.data as SendChunkResult
}

export function AdminFabricBulkCreateClient() {
  const { messages } = useI18n()
  const router = useRouter()
  const t = messages.admin.fabrics

  const [phase, setPhase] = React.useState<ImportPhase>('upload')
  const [fileName, setFileName] = React.useState<string>('')
  const [fileBuffer, setFileBuffer] = React.useState<ArrayBuffer | null>(null)
  const [workbook, setWorkbook] = React.useState<XLSX.WorkBook | null>(null)
  const [sheetInfos, setSheetInfos] = React.useState<SheetInfo[]>([])
  const [parsedRows, setParsedRows] = React.useState<BulkFabricRowInput[]>([])
  const [skippedCount, setSkippedCount] = React.useState(0)
  const [detectedHeaders, setDetectedHeaders] = React.useState<string[]>([])
  const [importProgress, setImportProgress] = React.useState({ done: 0, total: 0 })
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const parseAndPreview = React.useCallback(
    (wb: XLSX.WorkBook, sheetName: string) => {
      const result = parseSheet(wb, sheetName)
      if ('error' in result) {
        if (result.error === 'missing_title_ru') {
          toast.error(t.bulkCreateMissingColumn)
        } else {
          toast.error(t.bulkCreateInvalidFile)
        }
        return
      }

      const sheet = wb.Sheets[sheetName]
      const allRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet!, { defval: '' })
      const skipped = allRaw.length - result.rows.length

      setDetectedHeaders(result.headers)
      setParsedRows(result.rows)
      setSkippedCount(skipped)
      setPhase('preview')

      if (skipped > 0) {
        toast.warning(fillMessage(t.bulkCreateValidationErrors, { count: String(skipped) }))
      }
    },
    [t]
  )

  const loadFile = React.useCallback(
    async (file: File) => {
      setFileName(file.name)
      const buffer = await file.arrayBuffer()
      const info = getSheetInfos(buffer)
      if ('error' in info) {
        toast.error(t.bulkCreateInvalidFile)
        return
      }
      setFileBuffer(buffer)
      setWorkbook(info.workbook)
      setSheetInfos(info.sheets)
      if (info.sheets.length === 1) {
        parseAndPreview(info.workbook, info.sheets[0]!.name)
      } else {
        setPhase('sheet')
      }
    },
    [t, parseAndPreview]
  )

  const handleSelectSheet = React.useCallback(
    (sheetName: string) => {
      if (workbook) {
        parseAndPreview(workbook, sheetName)
      }
    },
    [workbook, parseAndPreview]
  )

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        loadFile(file)
      }
    },
    [loadFile]
  )

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        loadFile(file)
      }
    },
    [loadFile]
  )

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const startImport = React.useCallback(async () => {
    if (parsedRows.length === 0) return

    setPhase('importing')
    const totalRows = parsedRows.length
    setImportProgress({ done: 0, total: totalRows })

    let created = 0
    let failed = 0
    let rawStored = 0
    let lastError: string | null = null

    const chunks: BulkFabricRowInput[][] = []
    for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
      chunks.push(parsedRows.slice(i, i + CHUNK_SIZE))
    }

    for (const chunk of chunks) {
      try {
        const result = await sendChunk(chunk)
        created += result.ids.length
        rawStored += result.rawStored ?? 0
      } catch (e) {
        failed += chunk.length
        lastError = e instanceof Error ? e.message : 'Import failed'
        toast.error(lastError)
      }
      setImportProgress((prev) => ({ ...prev, done: Math.min(prev.done + chunk.length, totalRows) }))
    }

    setImportResult({ created, failed })
    setPhase('done')

    if (failed === 0) {
      toast.success('File upload successful, raw data stored successfully, AI processing running')
    } else if (created > 0) {
      toast.warning(`Partially completed — ${created} fabrics created, ${failed} failed. Raw data stored: ${rawStored} rows.`)
    } else {
      toast.error(lastError ?? 'Bulk import failed')
    }
  }, [parsedRows, t])

  const handleReset = React.useCallback(() => {
    setPhase('upload')
    setFileName('')
    setFileBuffer(null)
    setWorkbook(null)
    setSheetInfos([])
    setParsedRows([])
    setSkippedCount(0)
    setDetectedHeaders([])
    setImportProgress({ done: 0, total: 0 })
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const previewSlice = parsedRows.slice(0, PREVIEW_ROWS)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" asChild className="rounded-xl">
            <Link href="/admin/fabrics" aria-label={t.bulkCreateBack}>
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </Button>
          <div>
            <h2 className="font-heading text-lg font-bold text-on-surface">{t.bulkCreatePageTitle}</h2>
            <p className="text-sm text-on-surface-variant">{t.bulkCreatePageSubtitle}</p>
          </div>
        </div>

        {/* Upload phase */}
        {phase === 'upload' ? (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/60'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
              }}
            >
              <Upload className="size-10 text-outline" aria-hidden />
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface">{t.bulkCreateUploadTitle}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{t.bulkCreateUploadHint}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={(e) => e.stopPropagation()}>
                {t.bulkCreateSelectFile}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={downloadTemplate}>
                <Download className="mr-1.5 size-3.5" aria-hidden />
                {t.bulkCreateDownloadTemplate}
              </Button>
              <span className="text-xs text-on-surface-variant">{t.bulkCreateExpectedColumns}</span>
              <span className="text-xs text-on-surface-variant/60">
                {' '}(or: Product Name, Product Type, Weight, Width, Supplier, Color, Use...)
              </span>
            </div>
          </div>
        ) : null}

        {/* Sheet picker phase */}
        {phase === 'sheet' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{t.bulkCreateSelectSheet}</h3>
                <p className="text-xs text-on-surface-variant">{fileName}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={handleReset}>
                {t.bulkCreateChangeFile}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sheetInfos.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleSelectSheet(s.name)}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="text-sm font-medium text-on-surface">{s.name}</span>
                  <span className="text-xs text-on-surface-variant">
                    {fillMessage(t.bulkCreateSheetRowCount, { count: String(s.rowCount) })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Preview phase */}
        {phase === 'preview' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  {fillMessage(t.bulkCreatePreviewTitle, { total: String(parsedRows.length) })}
                </h3>
                {parsedRows.length > PREVIEW_ROWS ? (
                  <p className="text-xs text-on-surface-variant">
                    {fillMessage(t.bulkCreatePreviewNote, {
                      count: String(PREVIEW_ROWS),
                      total: String(parsedRows.length)
                    })}
                  </p>
                ) : null}
                {skippedCount > 0 ? (
                  <p className="text-xs text-amber-600">
                    {fillMessage(t.bulkCreateValidationErrors, { count: String(skippedCount) })}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={handleReset}>
                  {t.bulkCreateChangeFile}
                </Button>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              {fileName}
            </p>

            <ScrollArea className="max-h-[50vh] rounded-xl border border-outline-variant/20">
              <Table>
<TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead className="min-w-[120px]">title_ru</TableHead>
                        <TableHead>title_en</TableHead>
                        <TableHead>fabric_type</TableHead>
                        <TableHead>gsm</TableHead>
                        <TableHead>width_cm</TableHead>
                        <TableHead>price_usd</TableHead>
                        <TableHead>moq</TableHead>
                        <TableHead>tags</TableHead>
                        <TableHead>supplier</TableHead>
                        <TableHead>sku</TableHead>
                        <TableHead>usage</TableHead>
                        <TableHead>supply</TableHead>
                        <TableHead>shipment</TableHead>
                        <TableHead>color</TableHead>
                        <TableHead>description</TableHead>
                        <TableHead>hero image</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {previewSlice.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-outline">{idx + 1}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">{row.title_ru}</TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-on-surface-variant">
                        {row.title_en ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.fabric_type ?? '—'}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.gsm ?? '—'}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.width_cm ?? '—'}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.price_usd ?? '—'}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.moq ?? '—'}</TableCell>
                      <TableCell className="max-w-[100px] truncate text-sm text-on-surface-variant">
                        {row.tags?.join(', ') ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate text-sm text-on-surface-variant">
                        {row.supplier_name ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[80px] truncate text-sm text-on-surface-variant">
                        {row.sku ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate text-sm text-on-surface-variant">
                        {row.usage_ru ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.supply_type ?? '—'}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{row.shipment_time ?? '—'}</TableCell>
                      <TableCell className="max-w-[80px] truncate text-sm text-on-surface-variant">
                        {row.color ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-on-surface-variant">
                        {row.description_ru ?? '—'}
                      </TableCell>
<TableCell className="max-w-[150px] text-center">
                        {row.images?.[0] ? (
                          <a
                            href={row.images[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                            title="Open image"
                          >
                            <img
                              src={row.images[0]}
                              alt="hero"
                              className="h-12 w-auto rounded object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget
                                img.style.display = 'none'
                                const next = img.nextElementSibling as HTMLElement | null
                                if (next) next.classList.remove('hidden')
                              }}
                            />
                            <span className="hidden text-sm text-on-surface-variant">—</span>
                          </a>
                        ) : (
                          <span className="text-sm text-on-surface-variant">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={parsedRows.length === 0}
                className="rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                onClick={startImport}
              >
                {fillMessage(t.bulkCreateStartImport, { count: String(parsedRows.length) })}
              </Button>
              <Button type="button" variant="outline" asChild className="rounded-xl">
                <Link href="/admin/fabrics">{t.bulkCreateBack}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {/* Importing phase */}
        {phase === 'importing' ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-on-surface">
              {fillMessage(t.bulkCreateImporting, {
                done: String(importProgress.done),
                total: String(importProgress.total)
              })}
            </p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: importProgress.total > 0
                    ? `${Math.round((importProgress.done / importProgress.total) * 100)}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Done dialog */}
      <Dialog open={phase === 'done' && importResult !== null} onOpenChange={() => setPhase('upload')}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.bulkCreateSuccessTitle}</DialogTitle>
            <DialogDescription>
              {importResult && importResult.failed > 0
                ? fillMessage(t.bulkCreatePartialSuccess, {
                    created: String(importResult.created),
                    failed: String(importResult.failed)
                  })
                : fillMessage(t.bulkCreateSuccessMessage, {
                    created: String(importResult?.created ?? 0)
                  })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              className="rounded-xl"
              onClick={() => {
                setPhase('upload')
                router.push('/admin/fabrics')
              }}
            >
              {t.bulkCreateGoToList}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleReset}>
              {t.bulkCreateMore}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
