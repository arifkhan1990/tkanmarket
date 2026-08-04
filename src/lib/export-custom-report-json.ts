import type { CustomReportResponse } from '@/types/admin-custom-report.types'

export function downloadCustomReportJson(data: CustomReportResponse): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    ...data
  }
  const text = JSON.stringify(payload, null, 2)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeId = data.reportId.replace(/[^a-zA-Z0-9-_]/g, '_')
  a.download = `tkanmarket-report-${safeId}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
