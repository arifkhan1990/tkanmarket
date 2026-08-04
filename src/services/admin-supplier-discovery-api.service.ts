import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  CreateSupplierDiscoveryRunBody,
  PatchSupplierDraftBody,
  SupplierDiscoveryProductDraftRow,
  SupplierDiscoveryRunProductsListFilters,
  SupplierDiscoveryRunRow,
  SupplierDiscoveryRunSuppliersListFilters,
  SupplierDiscoverySupplierDraftRow
} from '@/types/supplier-discovery.types'

export async function fetchSupplierDiscoveryRuns(
  page: number,
  limit: number
): Promise<{ ok: boolean; json: ApiEnvelope<{ runs: SupplierDiscoveryRunRow[]; total: number }> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/runs?page=${page}&limit=${limit}`)
  const json = (await res.json()) as ApiEnvelope<{ runs: SupplierDiscoveryRunRow[]; total: number }>
  return { ok: res.ok, json }
}

export async function createSupplierDiscoveryRun(
  body: CreateSupplierDiscoveryRunBody
): Promise<{ ok: boolean; json: ApiEnvelope<{ id: number }> }> {
  const res = await fetch('/api/v1/admin/supplier-discovery/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = (await res.json()) as ApiEnvelope<{ id: number }>
  return { ok: res.ok, json }
}

export async function fetchSupplierDiscoveryRun(
  id: number
): Promise<{ ok: boolean; json: ApiEnvelope<SupplierDiscoveryRunRow> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/runs/${id}`)
  const json = (await res.json()) as ApiEnvelope<SupplierDiscoveryRunRow>
  return { ok: res.ok, json }
}

export async function fetchRunSuppliers(
  runId: number,
  params: { page: number; limit: number } & SupplierDiscoveryRunSuppliersListFilters
): Promise<{
  ok: boolean
  json: ApiEnvelope<{ suppliers: SupplierDiscoverySupplierDraftRow[]; total: number }>
}> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit)
  })
  if (params.qualified) sp.set('qualified', params.qualified)
  if (params.status) sp.set('status', params.status)
  if (params.source) sp.set('source', params.source)
  const res = await fetch(`/api/v1/admin/supplier-discovery/runs/${runId}/suppliers?${sp.toString()}`)
  const json = (await res.json()) as ApiEnvelope<{ suppliers: SupplierDiscoverySupplierDraftRow[]; total: number }>
  return { ok: res.ok, json }
}

export async function fetchSupplierProducts(
  runId: number,
  supplierId: number,
  params: { page: number; limit: number } & SupplierDiscoveryRunProductsListFilters
): Promise<{
  ok: boolean
  json: ApiEnvelope<{ products: SupplierDiscoveryProductDraftRow[]; total: number }>
}> {
  const sp = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.status) sp.set('status', params.status)
  const res = await fetch(
    `/api/v1/admin/supplier-discovery/runs/${runId}/suppliers/${supplierId}/products?${sp.toString()}`
  )
  const json = (await res.json()) as ApiEnvelope<{ products: SupplierDiscoveryProductDraftRow[]; total: number }>
  return { ok: res.ok, json }
}

export async function patchSupplierDraft(
  id: number,
  body: PatchSupplierDraftBody
): Promise<{ ok: boolean; json: ApiEnvelope<SupplierDiscoverySupplierDraftRow> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/supplier-drafts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const json = (await res.json()) as ApiEnvelope<SupplierDiscoverySupplierDraftRow>
  return { ok: res.ok, json }
}

export async function approveSupplierDraft(
  id: number
): Promise<{ ok: boolean; json: ApiEnvelope<SupplierDiscoverySupplierDraftRow> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/supplier-drafts/${id}/approve`, { method: 'POST' })
  const json = (await res.json()) as ApiEnvelope<SupplierDiscoverySupplierDraftRow>
  return { ok: res.ok, json }
}

export async function rejectSupplierDraft(
  id: number
): Promise<{ ok: boolean; json: ApiEnvelope<SupplierDiscoverySupplierDraftRow> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/supplier-drafts/${id}/reject`, { method: 'POST' })
  const json = (await res.json()) as ApiEnvelope<SupplierDiscoverySupplierDraftRow>
  return { ok: res.ok, json }
}

export async function ingestDiscoveryRun(
  runId: number
): Promise<{ ok: boolean; json: ApiEnvelope<{ suppliersCreated: number; fabricsCreated: number }> }> {
  const res = await fetch(`/api/v1/admin/supplier-discovery/runs/${runId}/ingest`, { method: 'POST' })
  const json = (await res.json()) as ApiEnvelope<{ suppliersCreated: number; fabricsCreated: number }>
  return { ok: res.ok, json }
}

