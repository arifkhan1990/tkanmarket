/** URL `created_from` / `created_to` are YYYY-MM-DD (UTC calendar days). */

export type FabricListDatePresetKey = 'all' | '7d' | '30d' | '90d' | 'custom'

export function parseYmdToUtcStart(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const parts = s.split('-').map(Number)
  const y = parts[0] ?? 0
  const mo = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0))
}

export function parseYmdToUtcEnd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const parts = s.split('-').map(Number)
  const y = parts[0] ?? 0
  const mo = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999))
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function utcStartYmdDaysAgo(daysBack: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysBack)
  return d.toISOString().slice(0, 10)
}

export function getFabricListDatePreset(createdFrom?: string, createdTo?: string): FabricListDatePresetKey {
  const cf = createdFrom?.trim()
  const ct = createdTo?.trim()
  if (!cf || !ct) return 'all'
  const today = utcTodayYmd()
  if (ct !== today) return 'custom'
  if (cf === utcStartYmdDaysAgo(7)) return '7d'
  if (cf === utcStartYmdDaysAgo(30)) return '30d'
  if (cf === utcStartYmdDaysAgo(90)) return '90d'
  return 'custom'
}

export function fabricListDatePresetToRange(preset: Exclude<FabricListDatePresetKey, 'custom'>): {
  createdFrom: string | null
  createdTo: string | null
} {
  if (preset === 'all') return { createdFrom: null, createdTo: null }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  return {
    createdFrom: utcStartYmdDaysAgo(days),
    createdTo: utcTodayYmd()
  }
}
