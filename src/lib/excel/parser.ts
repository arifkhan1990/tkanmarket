import * as XLSX from 'xlsx'

import { mapFabricType } from './fabric-type-mapper'
import { parseGsm, parseWidthCm, parseComposition } from './parsers'
import type { FabricCompositionItem } from '@/types/fabric'

export interface ExcelRow {
  serialNo: number | null
  sku: string | null
  productName: string | null
  productType: string | null
  composition: string | null
  weight: string | null
  width: string | null
  use: string | null
  color: string | null
  supplyType: string | null
  shipmentTime: string | null
  supplier: string | null
  heroImage: string | null
  image1: string | null
  image2: string | null
  image3: string | null
  image4: string | null
}

export interface ParsedFabricRow {
  sku: string | null
  titleRu: string
  titleEn: string | null
  descriptionRu: string | null
  usageRu: string | null
  fabricType: string | null
  gsm: number | null
  widthCm: number | null
  color: string | null
  supplyType: string | null
  shipmentTime: string | null
  supplierName: string | null
  composition: FabricCompositionItem[] | null
  images: string[] | null
}

export interface ExcelParseResult {
  rows: ParsedFabricRow[]
  totalRows: number
  errors: Array<{ row: number; field: string; message: string }>
}

const COLUMN_MAP: Record<string, string> = {
  'serial no': 'serialNo',
  'sku': 'sku',
  'sku / item number': 'sku',
  'item number': 'sku',
  'product name': 'productName',
  'product type': 'productType',
  'composition': 'composition',
  'composition / material': 'composition',
  'material': 'composition',
  'weight': 'weight',
  'width': 'width',
  'use': 'use',
  'color': 'color',
  'supply type': 'supplyType',
  'shipment time': 'shipmentTime',
  'supplier': 'supplier',
  'supplier name': 'supplier',
  'hero image': 'heroImage',
  'image 1': 'image1',
  'image 2': 'image2',
  'image 3': 'image3',
  'image 4': 'image4',
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
}

function mapHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const normalized = normalizeHeader(h)
    return COLUMN_MAP[normalized] ?? COLUMN_MAP[h.trim().toLowerCase()] ?? ''
  })
}

export function parseExcel(buffer: ArrayBuffer): ExcelParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], totalRows: 0, errors: [{ row: 0, field: 'file', message: 'No sheets found in workbook' }] }
  }

  const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  if (rawData.length === 0) {
    return { rows: [], totalRows: 0, errors: [{ row: 0, field: 'file', message: 'Sheet is empty' }] }
  }

  const headerKeys = mapHeaders(Object.keys(rawData[0] ?? {}))
  const rows: ExcelRow[] = rawData.map((item) => {
    const values = Object.values(item)
    const mapped: Record<string, unknown> = {}
    headerKeys.forEach((key, idx) => {
      mapped[key] = values[idx] ?? null
    })
    return mapped as unknown as ExcelRow
  })

  const result: ParsedFabricRow[] = []
  const errors: ExcelParseResult['errors'] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as ExcelRow
    const rowNum = i + 2

    if (!row.productName || String(row.productName).trim().length === 0) {
      continue
    }

    const titleRu = String(row.productName).trim()
    if (titleRu.length < 2) {
      errors.push({ row: rowNum, field: 'productName', message: 'Product name is too short' })
      continue
    }

    const images: string[] = []
    for (const imgField of ['heroImage', 'image1', 'image2', 'image3', 'image4'] as const) {
      const url = row[imgField]
      if (url && String(url).trim().length > 0) {
        images.push(String(url).trim())
      }
    }

    result.push({
      sku: row.sku ? String(row.sku).trim() : null,
      titleRu,
      titleEn: null,
      usageRu: row.use ? String(row.use).trim() : null,
      descriptionRu: null,
      fabricType: mapFabricType(row.productType ? String(row.productType) : null),
      gsm: parseGsm(row.weight ? String(row.weight) : null),
      widthCm: parseWidthCm(row.width ? String(row.width) : null),
      color: row.color ? String(row.color).trim() || null : null,
      supplyType: row.supplyType ? String(row.supplyType).trim() : null,
      shipmentTime: row.shipmentTime ? String(row.shipmentTime).trim() : null,
      supplierName: row.supplier ? String(row.supplier).trim() : null,
      composition: parseComposition(row.composition ? String(row.composition) : null),
      images: images.length > 0 ? images : null,
    })
  }

  return { rows: result, totalRows: result.length, errors }
}
