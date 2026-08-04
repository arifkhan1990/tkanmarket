import { cn } from '@/lib/utils'
import type { AdminFabricCategoryTerm } from '@/types/admin-fabric-category-terms.types'

export function FabricCategoryStatusBadge(props: { row: AdminFabricCategoryTerm }) {
  const isArchived = Boolean(props.row.deleted_at)
  const label = isArchived ? 'Archived' : props.row.is_active ? 'Active' : 'Inactive'
  const tone = isArchived
    ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
    : props.row.is_active
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold', tone)}>
      {label}
    </span>
  )
}

