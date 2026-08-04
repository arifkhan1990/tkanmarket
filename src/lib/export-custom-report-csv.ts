import type { CustomReportResponse } from '@/types/admin-custom-report.types'

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function downloadCustomReportPreviewCsv(data: CustomReportResponse): void {
  const header = ['transaction_id', 'source_partner', 'fabric_type', 'quantity_meters', 'total_value_usd']
  const lines = [
    header.map(csvCell).join(','),
    ...data.previewRows.map((r) =>
      [
        r.transactionId,
        r.sourcePartner,
        r.fabricType ?? '',
        r.quantityMeters != null ? String(r.quantityMeters) : '',
        r.totalValueUsd != null ? r.totalValueUsd.toFixed(2) : ''
      ]
        .map(csvCell)
        .join(',')
    )
  ]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeId = data.reportId.replace(/[^a-zA-Z0-9-_]/g, '_')
  a.download = `tkanmarket-report-${safeId}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
