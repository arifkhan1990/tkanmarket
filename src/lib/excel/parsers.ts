import type { FabricCompositionItem } from '@/types/fabric'

export function parseGsm(weightText: string | null | undefined): number | null {
  if (!weightText) return null
  const cleaned = weightText.trim().toLowerCase().replace(/\s+/g, '')
  const match = cleaned.match(/(\d+)/)
  if (!match) return null
  const val = parseInt(match[1] as string, 10)
  if (val < 1 || val > 9999) return null
  return val
}

export function parseWidthCm(widthText: string | null | undefined): number | null {
  if (!widthText) return null
  const cleaned = widthText.trim().toLowerCase().replace(/\s+/g, '')
  const match = cleaned.match(/(\d+)/)
  if (!match) return null
  const val = parseInt(match[1] as string, 10)
  if (val < 1 || val > 9999) return null
  return val
}

export function parseComposition(compText: string | null | undefined): FabricCompositionItem[] | null {
  if (!compText) return null
  const trimmed = compText.trim()
  if (trimmed.length === 0) return null

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null

  const items: FabricCompositionItem[] = []

  for (const part of parts) {
    const match = part.match(/(\d+)\s*%\s*(.+)/)
    if (match) {
      const percentage = parseInt(match[1] as string, 10)
      const material = (match[2] as string).trim()
      if (material.length > 0 && percentage > 0 && percentage <= 100) {
        items.push({ material, percentage })
      }
    }
  }

  return items.length > 0 ? items : null
}

export function parseGoogleDriveId(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

export function buildDirectDownloadUrl(driveId: string): string {
  return `https://drive.google.com/uc?export=download&id=${driveId}`
}
