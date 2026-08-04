'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchAdminCustomReport } from '@/services/admin/custom-report-admin.service'

export function useAdminCustomReportQuery() {
  const query = useQuery({
    queryKey: ['admin-custom-report'],
    queryFn: fetchAdminCustomReport,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load report data')
  }, [query.error])

  return query
}
