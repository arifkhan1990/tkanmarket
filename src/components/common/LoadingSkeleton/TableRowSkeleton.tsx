import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export type TableRowSkeletonProps =
  | {
      /** Default: block layout for grids / outside `<table>`. */
      asTableRow?: false
    }
  | {
      asTableRow: true
      /** Number of `<td>` cells (must match table header columns). */
      columns: number
    }

export function TableRowSkeleton(props: TableRowSkeletonProps = {}) {
  if (props.asTableRow === true) {
    const { columns } = props
    return (
      <TableRow>
        {Array.from({ length: columns }).map((_, i) => (
          <TableCell key={i}>
            <Skeleton className="h-4 w-full max-w-[140px]" />
          </TableCell>
        ))}
      </TableRow>
    )
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  )
}
