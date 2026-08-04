'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchAdminDataMigrationMapping } from '@/services/admin/data-migration-mapping-admin.service'

export function useAdminDataMigrationMappingQuery() {
  const query = useQuery({
    queryKey: ['admin-data-migration-mapping'],
    queryFn: fetchAdminDataMigrationMapping,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load mapping data')
  }, [query.error])

  return query
}
