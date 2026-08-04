'use client'

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  approveSupplierDraft,
  createSupplierDiscoveryRun,
  fetchRunSuppliers,
  fetchSupplierDiscoveryRun,
  fetchSupplierDiscoveryRuns,
  fetchSupplierProducts,
  ingestDiscoveryRun,
  rejectSupplierDraft
} from '@/services/admin-supplier-discovery-api.service'
import type {
  CreateSupplierDiscoveryRunBody,
  SupplierDiscoveryRunProductsListFilters,
  SupplierDiscoveryRunSuppliersListFilters
} from '@/types/supplier-discovery.types'

export function useSupplierDiscoveryRunsQuery(page: number, limit: number, loadErrorMessage: string) {
  const q = useQuery({
    queryKey: ['admin-supplier-discovery-runs', page, limit],
    refetchInterval: 4000,
    queryFn: async () => {
      const { ok, json } = await fetchSupplierDiscoveryRuns(page, limit)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : loadErrorMessage)
      }
      return json.data
    }
  })

  React.useEffect(() => {
    if (!q.error) return
    toast.error(q.error instanceof Error ? q.error.message : loadErrorMessage)
  }, [loadErrorMessage, q.error])

  return q
}

export function useSupplierDiscoveryRunQuery(runId: number | null, loadErrorMessage: string) {
  return useQuery({
    queryKey: ['admin-supplier-discovery-run', runId],
    enabled: runId !== null && runId > 0,
    refetchInterval: (query) => {
      const st = query.state.data?.status
      if (st === 'RUNNING' || st === 'PENDING') return 3000
      return false
    },
    queryFn: async () => {
      if (!runId) throw new Error('Invalid run')
      const { ok, json } = await fetchSupplierDiscoveryRun(runId)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : loadErrorMessage)
      }
      return json.data
    }
  })
}

export function useRunSuppliersQuery(
  runId: number | null,
  page: number,
  limit: number,
  filters: SupplierDiscoveryRunSuppliersListFilters,
  loadErrorMessage: string
) {
  return useQuery({
    queryKey: ['admin-supplier-discovery-suppliers', runId, page, limit, filters],
    enabled: runId !== null && runId > 0,
    queryFn: async () => {
      if (!runId) throw new Error('Invalid run')
      const { ok, json } = await fetchRunSuppliers(runId, { page, limit, ...filters })
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : loadErrorMessage)
      }
      return json.data
    }
  })
}

export function useSupplierProductsQuery(
  runId: number | null,
  supplierId: number | null,
  page: number,
  limit: number,
  filters: SupplierDiscoveryRunProductsListFilters,
  loadErrorMessage: string
) {
  return useQuery({
    queryKey: ['admin-supplier-discovery-products', runId, supplierId, page, limit, filters],
    enabled: runId !== null && supplierId !== null && runId > 0 && supplierId > 0,
    queryFn: async () => {
      if (!runId || !supplierId) throw new Error('Invalid')
      const { ok, json } = await fetchSupplierProducts(runId, supplierId, { page, limit, ...filters })
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : loadErrorMessage)
      }
      return json.data
    }
  })
}

export function useCreateSupplierDiscoveryRunMutation(messages: {
  success: string
  failed: string
}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateSupplierDiscoveryRunBody) => {
      const { ok, json } = await createSupplierDiscoveryRun(body)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.failed)
      }
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.success)
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-runs'] })
    },
    onError: (e: Error) => toast.error(e.message)
  })
}

export function useApproveSupplierDraftMutation(messages: { success: string; failed: string }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (draftId: number) => {
      const { ok, json } = await approveSupplierDraft(draftId)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.failed)
      }
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.success)
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-suppliers'] })
    },
    onError: (e: Error) => toast.error(e.message)
  })
}

export function useRejectSupplierDraftMutation(messages: { success: string; failed: string }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (draftId: number) => {
      const { ok, json } = await rejectSupplierDraft(draftId)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.failed)
      }
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.success)
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-suppliers'] })
    },
    onError: (e: Error) => toast.error(e.message)
  })
}

export function useIngestDiscoveryRunMutation(messages: { success: string; failed: string }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (runId: number) => {
      const { ok, json } = await ingestDiscoveryRun(runId)
      if (!ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.failed)
      }
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.success)
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-runs'] })
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-run'] })
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-suppliers'] })
      void qc.invalidateQueries({ queryKey: ['admin-supplier-discovery-products'] })
    },
    onError: (e: Error) => toast.error(e.message)
  })
}
