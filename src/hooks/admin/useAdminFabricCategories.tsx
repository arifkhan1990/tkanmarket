'use client'

import * as React from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { AdminFabricCategoryTermCreateInput, AdminFabricCategoryTermUpdateInput } from '@/types/admin-fabric-category-terms.types'
import {
  archiveAdminFabricCategory,
  createAdminFabricCategory,
  fetchAdminFabricCategories,
  restoreAdminFabricCategory,
  updateAdminFabricCategory
} from '@/services/admin-fabric-categories-api.service'

export function useAdminFabricCategoriesQuery(params: {
  page: number
  limit: number
  q?: string
  includeInactive?: boolean
  includeArchived?: boolean
}) {
  const query = useQuery({
    queryKey: ['admin-fabric-categories', params],
    queryFn: async () => {
      const json = await fetchAdminFabricCategories(params)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load categories')
  }, [query.error])

  return query
}

export function useAdminFabricCategoryMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: AdminFabricCategoryTermCreateInput) => {
      const json = await createAdminFabricCategory(input)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-categories'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-category-options'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-taxonomy'] })
      toast.success('Category created')
    }
  })

  const update = useMutation({
    mutationFn: async (input: { id: number; patch: AdminFabricCategoryTermUpdateInput }) => {
      const json = await updateAdminFabricCategory(input.id, input.patch)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-categories'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-category-options'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-taxonomy'] })
      toast.success('Category updated')
    }
  })

  const archive = useMutation({
    mutationFn: async (id: number) => {
      const json = await archiveAdminFabricCategory(id)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-categories'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-category-options'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-taxonomy'] })
      toast.success('Category archived')
    }
  })

  const restore = useMutation({
    mutationFn: async (id: number) => {
      const json = await restoreAdminFabricCategory(id)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-categories'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-category-options'] })
      await qc.invalidateQueries({ queryKey: ['admin-fabric-taxonomy'] })
      toast.success('Category restored')
    }
  })

  React.useEffect(() => {
    const err = create.error ?? update.error ?? archive.error ?? restore.error
    if (!err) return
    toast.error(err instanceof Error ? err.message : 'Action failed')
  }, [archive.error, create.error, restore.error, update.error])

  const isBusy = create.isPending || update.isPending || archive.isPending || restore.isPending

  return { create, update, archive, restore, isBusy }
}

