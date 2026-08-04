export const FABRIC_COMPARE_STORAGE_KEY = 'tkan_fabric_compare_v1'
const STORAGE_KEY = FABRIC_COMPARE_STORAGE_KEY
export const FABRIC_COMPARE_MAX = 4

/** Fired on same-tab updates after localStorage write. */
export const COMPARE_LIST_CHANGED_EVENT = 'tkan-fabric-compare-changed'

function notifyCompareListChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(COMPARE_LIST_CHANGED_EVENT))
}

function readRaw(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, FABRIC_COMPARE_MAX)
  } catch {
    return []
  }
}

/** Returns true on success, false if storage is unavailable (private mode / quota). */
function write(ids: number[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, FABRIC_COMPARE_MAX)))
    notifyCompareListChanged()
    return true
  } catch {
    // Quota exceeded or storage disabled (private mode)
    return false
  }
}

export function getStoredCompareIds(): number[] {
  return readRaw()
}

export type AddCompareResult =
  | { ok: true; ids: number[] }
  | { ok: false; reason: 'max' | 'duplicate' | 'invalid' | 'storage' }

export function addCompareId(id: number): AddCompareResult {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, reason: 'invalid' }
  const cur = readRaw()
  if (cur.includes(id)) return { ok: false, reason: 'duplicate' }
  if (cur.length >= FABRIC_COMPARE_MAX) return { ok: false, reason: 'max' }
  const next = [...cur, id]
  if (!write(next)) return { ok: false, reason: 'storage' }
  return { ok: true, ids: next }
}

export function removeStoredCompareId(id: number): number[] {
  const next = readRaw().filter((x) => x !== id)
  write(next)
  return next
}

export function clearStoredCompareIds(): void {
  write([])
}

/** Replace the stored list (e.g. after opening a shared compare URL). Max 4 ids. */
export function replaceStoredCompareIds(ids: number[]): boolean {
  const next = ids
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, FABRIC_COMPARE_MAX)
  return write(next)
}

/**
 * Reconcile storage with the set of IDs that actually exist in the catalog
 * (e.g. after fetching the compare results we know which IDs are still
 * valid — drop any that were soft-deleted or unapproved).
 * Returns true if storage was changed.
 */
export function syncStoredCompareIds(validIds: ReadonlySet<number>): boolean {
  const cur = readRaw()
  const next = cur.filter((id) => validIds.has(id))
  if (next.length === cur.length) return false
  write(next)
  return true
}
