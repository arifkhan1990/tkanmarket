'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ChevronDown, Download, Plus, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRbacMatrixQuery } from '@/hooks/admin/useRbacAdmin'
import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AuditLogListResponse } from '@/types/audit-log-admin.types'
import type { RbacMatrixResponse } from '@/types/rbac-admin.types'
import { cn } from '@/lib/utils'

const MODULE_ROWS: Array<{
  label: string
  view: string | null
  edit: string | null
  delete: string | null
  approve: string | null
}> = [
  { label: 'Catalog', view: 'catalog.view', edit: 'catalog.edit', delete: null, approve: 'catalog.approve' },
  { label: 'Suppliers', view: 'suppliers.view', edit: 'suppliers.edit', delete: null, approve: null },
  { label: 'Leads', view: 'leads.view', edit: 'leads.edit', delete: null, approve: null },
  { label: 'System', view: 'system.logs.view', edit: null, delete: null, approve: 'system.roles.manage' }
]

function hasPermission(matrix: RbacMatrixResponse, roleId: number, key: string | null): boolean {
  if (!key) return false
  const perm = matrix.permissions.find((p) => p.key === key)
  if (!perm) return false
  return matrix.role_permission_keys.some((rp) => rp.role_id === roleId && rp.permission_id === perm.id)
}

export function RolesPermissionsClient() {
  const { messages } = useI18n()
  const p = messages.admin.rolesPermissionsPage
  const matrixQuery = useRbacMatrixQuery()
  const matrix = matrixQuery.data

  const auditQuery = useQuery({
    queryKey: ['admin-audit-brief'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/audit-log?page=1&limit=8')
      const json = (await res.json()) as ApiEnvelope<AuditLogListResponse>
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000
  })

  const [openRoleId, setOpenRoleId] = useState<number | null>(null)

  const rolesSorted = useMemo(() => {
    if (!matrix) return []
    return [...matrix.roles].sort((a, b) => a.key.localeCompare(b.key))
  }, [matrix])

  const userCount = (roleId: number) => matrix?.role_user_counts.find((x) => x.role_id === roleId)?.count ?? 0

  const exportMatrix = () => {
    if (!matrix) return
    const blob = new Blob([JSON.stringify(matrix, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rbac-matrix-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-10 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-on-surface-variant">{p.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={exportMatrix} disabled={!matrix}>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {p.exportMatrix}
          </Button>
          <Button asChild className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20">
            <Link href="/admin/access">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              {p.createRole}
            </Link>
          </Button>
        </div>
      </div>

      {matrixQuery.isLoading ? (
        <div className="rounded-xl border border-outline/10 bg-surface-container-low p-8 text-sm text-on-surface-variant">{p.loading}</div>
      ) : !matrix ? (
        <div className="text-sm text-on-surface-variant">{messages.admin.loadErrors.rbac}</div>
      ) : (
        <div className="space-y-4">
          {rolesSorted.map((role) => {
            const expanded = openRoleId === role.id
            return (
              <div key={role.id} className="overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-surface-container-low md:p-6"
                  onClick={() => setOpenRoleId((cur) => (cur === role.id ? null : role.id))}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shield className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-xl font-bold text-on-surface">{role.name}</h3>
                        {role.key === 'admin' ? (
                          <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                            system
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-on-surface-variant">{role.description ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden text-right sm:block">
                      <div className="text-xs font-mono uppercase tracking-tighter text-outline">{p.assignedTo}</div>
                      <div className="text-sm font-semibold">{p.users.replace('{n}', String(userCount(role.id)))}</div>
                    </div>
                    <ChevronDown className={cn('h-5 w-5 text-outline transition-transform', expanded && 'rotate-180')} aria-hidden />
                  </div>
                </button>
                {expanded ? (
                  <div className="border-t border-outline/10 bg-surface-container-low p-4 md:p-8">
                    <div className="mb-6 grid gap-6 lg:grid-cols-4">
                      <div className="lg:col-span-1">
                        <h4 className="font-bold text-on-surface">{p.moduleAccess}</h4>
                        <p className="mt-1 text-xs text-on-surface-variant">{p.moduleHint}</p>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-[10px] font-mono uppercase tracking-widest text-outline">{p.colModule}</TableHead>
                                <TableHead className="text-center text-[10px] font-mono uppercase tracking-widest text-outline">{p.colView}</TableHead>
                                <TableHead className="text-center text-[10px] font-mono uppercase tracking-widest text-outline">{p.colEdit}</TableHead>
                                <TableHead className="text-center text-[10px] font-mono uppercase tracking-widest text-outline">{p.colDelete}</TableHead>
                                <TableHead className="text-center text-[10px] font-mono uppercase tracking-widest text-outline">{p.colApprove}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {MODULE_ROWS.map((row) => (
                                <TableRow key={row.label}>
                                  <TableCell className="py-4 text-sm font-semibold">{row.label}</TableCell>
                                  <TableCell className="text-center">
                                    {row.view && hasPermission(matrix, role.id, row.view) ? (
                                      <CheckCircle2 className="mx-auto h-5 w-5 text-primary" aria-hidden />
                                    ) : (
                                      <span className="text-outline">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.edit && hasPermission(matrix, role.id, row.edit) ? (
                                      <CheckCircle2 className="mx-auto h-5 w-5 text-primary" aria-hidden />
                                    ) : (
                                      <span className="text-outline">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.delete && hasPermission(matrix, role.id, row.delete) ? (
                                      <CheckCircle2 className="mx-auto h-5 w-5 text-primary" aria-hidden />
                                    ) : (
                                      <span className="text-outline">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.approve && hasPermission(matrix, role.id, row.approve) ? (
                                      <CheckCircle2 className="mx-auto h-5 w-5 text-primary" aria-hidden />
                                    ) : (
                                      <span className="text-outline">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-outline/20 bg-surface-container-low p-6 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-heading text-xl font-bold text-on-surface">{p.securityLog}</h4>
            <Link href="/admin/audit-log" className="text-sm font-bold text-primary hover:underline">
              {p.viewAll}
            </Link>
          </div>
          <div className="space-y-3">
            {(auditQuery.data?.items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm shadow-sm"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', item.success ? 'bg-primary' : 'bg-red-500')} />
                <span className="font-mono text-xs text-outline">{new Date(item.created_at).toLocaleString()}</span>
                <span className="text-on-surface">
                  <span className="font-semibold">{item.action}</span>
                  {item.message ? ` — ${item.message}` : ''}
                </span>
              </div>
            ))}
            {auditQuery.isLoading ? <div className="text-sm text-on-surface-variant">…</div> : null}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 text-white">
          <div className="relative z-10">
            <h4 className="font-heading text-xl font-bold">{p.customRoleTitle}</h4>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100">{p.customRoleBody}</p>
            <Button asChild variant="secondary" className="mt-6 rounded-lg font-bold text-indigo-700">
              <Link href="/admin/access">{p.customRoleCta}</Link>
            </Button>
          </div>
          <Shield className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 opacity-10" aria-hidden />
        </div>
      </div>
    </div>
  )
}
