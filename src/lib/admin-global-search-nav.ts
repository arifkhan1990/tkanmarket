import type { Locale } from '@/types/i18n.types'
import type {
  AdminGlobalSearchResponse,
  AdminGlobalSearchScope
} from '@/types/admin-global-search.types'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export type AdminGlobalSearchNavHit = {
  id: string
  href: string
  label: string
}

export function buildAdminGlobalSearchNavItems(
  data: AdminGlobalSearchResponse | undefined,
  scope: AdminGlobalSearchScope,
  locale: Locale
): AdminGlobalSearchNavHit[] {
  if (!data) return []
  const items: AdminGlobalSearchNavHit[] = []

  const includeFabrics = scope === 'all' || scope === 'fabrics'
  const includeSuppliers = scope === 'all' || scope === 'suppliers'
  const includeLeads = scope === 'all' || scope === 'leads'

  if (includeFabrics) {
    for (const f of data.fabrics) {
      items.push({
        id: `fabric-${f.id}`,
        href: withLocaleUrl(`/admin/fabrics/${f.id}`, locale),
        label: f.title
      })
    }
  }
  if (includeSuppliers) {
    for (const s of data.suppliers) {
      items.push({
        id: `supplier-${s.id}`,
        href: withLocaleUrl(`/admin/suppliers?q=${encodeURIComponent(s.name)}`, locale),
        label: s.name
      })
    }
  }
  if (includeLeads) {
    for (const l of data.leads) {
      items.push({
        id: `lead-${l.id}`,
        href: withLocaleUrl(`/admin/leads/${l.id}`, locale),
        label: `${l.contactName} — ${l.companyName}`
      })
    }
  }

  return items
}
