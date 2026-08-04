'use client'

import * as React from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  AdminFabricCategoryOption,
  AdminFabricListResponse,
  AdminSupplierOption,
  BulkFabricCreateInput,
  BulkFabricCreateResponse
} from '@/types/admin-fabric-management.types'
import { useI18n } from '@/hooks/useI18n'

function updateListCache(
  prev: AdminFabricListResponse | undefined,
  ids: number[],
  nextStatus: 'approved' | 'rejected'
): AdminFabricListResponse | undefined {
  if (!prev) return prev
  const idSet = new Set(ids)
  return {
    ...prev,
    items: prev.items.map((it) => (idSet.has(it.id) ? { ...it, status: nextStatus } : it))
  }
}

export function useAdminFabricList(
  params: {
    page: number
    limit: number
    status?: string
    q?: string
    supplierId?: number
    createdFrom?: string
    createdTo?: string
    categorySlug?: string
  },
  options?: { initialData?: AdminFabricListResponse }
) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-fabric-list', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.status) sp.set('status', params.status)
      if (params.q) sp.set('q', params.q)
      if (typeof params.supplierId === 'number' && params.supplierId > 0) {
        sp.set('supplier_id', String(params.supplierId))
      }
      if (params.createdFrom) sp.set('created_from', params.createdFrom)
      if (params.createdTo) sp.set('created_to', params.createdTo)
      if (params.categorySlug) sp.set('category_slug', params.categorySlug)
      const res = await fetch(`/api/v1/admin/fabrics?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminFabricListResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    initialData: options?.initialData,
    placeholderData: keepPreviousData
  })
}

export function useAdminSupplierOptions() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-supplier-options'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/select')
      const json = (await res.json()) as ApiEnvelope<AdminSupplierOption[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useAdminCategoryOptions() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-fabric-category-options'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/fabric-categories/select')
      const json = (await res.json()) as ApiEnvelope<AdminFabricCategoryOption[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useAdminFabricCreate() {
  const { messages } = useI18n()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { supplierId: number; titleRu: string }) => {
      const res = await fetch('/api/v1/admin/fabrics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ supplier_id: input.supplierId, title_ru: input.titleRu })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
    }
  })
}

export function useAdminBulkFabricCreate() {
  const { messages } = useI18n()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BulkFabricCreateInput) => {
      const res = await fetch('/api/v1/admin/fabrics/bulk-create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<BulkFabricCreateResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
    }
  })
}

export function useAdminFabricActions() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  const approve = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/fabrics/${id}/approve`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin-fabric-list'] })
      const snapshots = qc.getQueriesData<AdminFabricListResponse>({ queryKey: ['admin-fabric-list'] })
      for (const [key, data] of snapshots) {
        qc.setQueryData(key, updateListCache(data, [id], 'approved'))
      }
      return { snapshots }
    },
    onError: (_err, _id, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.toastFabricApproved)
    }
  })

  const reject = useMutation({
    mutationFn: async (input: { id: number; reason: string }) => {
      const res = await fetch(`/api/v1/admin/fabrics/${input.id}/reject`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: input.reason })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['admin-fabric-list'] })
      const snapshots = qc.getQueriesData<AdminFabricListResponse>({ queryKey: ['admin-fabric-list'] })
      for (const [key, data] of snapshots) {
        qc.setQueryData(key, updateListCache(data, [input.id], 'rejected'))
      }
      return { snapshots }
    },
    onError: (_err, _input, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.toastFabricRejected)
    }
  })

  const bulkApprove = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch('/api/v1/admin/fabrics/bulk-approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['admin-fabric-list'] })
      const snapshots = qc.getQueriesData<AdminFabricListResponse>({ queryKey: ['admin-fabric-list'] })
      for (const [key, data] of snapshots) {
        qc.setQueryData(key, updateListCache(data, ids, 'approved'))
      }
      return { snapshots }
    },
    onError: (_err, _ids, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.toastFabricsApproved)
    }
  })

  const aiProcess = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/fabrics/${id}/ai-process`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({})
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabrics.aiProcessQueuedToast)
    }
  })

  const bulkAiProcess = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch('/api/v1/admin/fabrics/bulk-ai-process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const json = (await res.json()) as ApiEnvelope<{ succeeded: number; failed: number; total: number }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(
        messages.admin.fabrics.aiProcessQueuedToast
      )
    }
  })

  const processAllRaw = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/fabrics/process-all-raw', {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      })
      const json = (await res.json()) as ApiEnvelope<{ succeeded: number; failed: number; total: number }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      if (data.total === 0) {
        toast.info('No raw_scraped fabrics to process.')
        return
      }
      toast.success(`${data.succeeded} of ${data.total} fabrics queued for AI processing.`)
    }
  })

  const bulkReject = useMutation({
    mutationFn: async (input: { ids: number[]; reason: string }) => {
      const res = await fetch('/api/v1/admin/fabrics/bulk-reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['admin-fabric-list'] })
      const snapshots = qc.getQueriesData<AdminFabricListResponse>({ queryKey: ['admin-fabric-list'] })
      for (const [key, data] of snapshots) {
        qc.setQueryData(key, updateListCache(data, input.ids, 'rejected'))
      }
      return { snapshots }
    },
    onError: (_err, _input, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.toastFabricsRejected)
    }
  })

  const generateBlog = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/v1/admin/blog/ai-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fabricId: id })
      })
      const json = (await res.json()) as ApiEnvelope<{ slug: string }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.blogGeneratedToast)
    }
  })

  const generateVideo = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/fabrics/${id}/generate-video`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      })
      const json = (await res.json()) as ApiEnvelope<{ post_id: number; media_id: number }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.videoQueuedToast)
    }
  })

  const generateSocial = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/v1/admin/social/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fabric_id: id, platform: 'INSTAGRAM' })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-fabric-list'] })
      toast.success(messages.admin.fabricActions.socialCreatedToast)
    }
  })

  React.useEffect(() => {
    const err =
      approve.error ?? reject.error ?? bulkApprove.error ?? bulkReject.error ?? aiProcess.error ?? bulkAiProcess.error ?? processAllRaw.error ??
      generateBlog.error ?? generateVideo.error ?? generateSocial.error
    if (!err) return
    toast.error(err instanceof Error ? err.message : messages.admin.fabricActions.actionFailed)
  }, [
    aiProcess.error,
    approve.error,
    bulkAiProcess.error,
    bulkApprove.error,
    bulkReject.error,
    generateBlog.error,
    generateSocial.error,
    generateVideo.error,
    messages.admin.fabricActions.actionFailed,
    processAllRaw.error,
    reject.error
  ])

  return {
    approve,
    reject,
    bulkApprove,
    bulkReject,
    aiProcess,
    bulkAiProcess,
    processAllRaw,
    generateBlog,
    generateVideo,
    generateSocial
  }
}

