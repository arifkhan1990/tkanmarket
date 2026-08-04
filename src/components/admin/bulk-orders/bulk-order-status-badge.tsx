import type { BulkOrderStatus } from '@/types/admin-bulk-orders.types'

const tone: Record<BulkOrderStatus, string> = {
  PROCESSING: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-red-100 text-red-800'
}

export function BulkOrderStatusBadge({
  status,
  labels
}: {
  status: BulkOrderStatus
  labels: Record<BulkOrderStatus, string>
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[status]}`}>
      {labels[status]}
    </span>
  )
}
