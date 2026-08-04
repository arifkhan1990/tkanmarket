/* Shared Helper Types and Functions for Prompt Rules */

export async function api<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    })
    const json = (await res.json()) as { data?: T; error?: string }
    return json
  } catch {
    return { error: 'Network error' }
  }
}

export function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const CONDITION_FIELDS = [
  { value: 'fabricType', label: 'Fabric Type' },
  { value: 'color', label: 'Color' },
  { value: 'gsm', label: 'GSM (Weight)' },
  { value: 'composition', label: 'Composition' },
  { value: 'tag', label: 'Tag / Category' },
  { value: 'supplyType', label: 'Supply Type' }
] as const

export const AVAILABLE_VARIABLES = [
  { tag: '{title}', label: 'Title', desc: 'Fabric main name' },
  { tag: '{color}', label: 'Color', desc: 'Fabric color' },
  { tag: '{fabricType}', label: 'Fabric Type', desc: 'e.g. Silk, Denim' },
  { tag: '{gsm}', label: 'GSM', desc: 'Grammage weight' },
  { tag: '{composition}', label: 'Composition', desc: 'Material blend' },
  { tag: '{tags}', label: 'Tags', desc: 'Keywords' },
  { tag: '{description}', label: 'Description', desc: 'Full description' }
]
