'use client'

import * as React from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildModuleMatrixForRole, roleUserCount } from '@/lib/rbac/module-matrix'
import { cn } from '@/lib/utils'
import type { RbacMatrixResponse } from '@/types/rbac-admin.types'

type RbacCardMessages = {
  searchPlaceholder: string
  exportMatrix: string
  createRole: string
  createRoleHint: string
  assignedLabel: string
  usersCount: string
  moduleTitle: string
  moduleHint: string
  colModule: string
  colView: string
  colEdit: string
  colDelete: string
  colApprove: string
  systemDefault: string
  expandDetails: string
  emptyRoleMatrix: string
}

function iconForRoleKey(key: string) {
  const k = key.toLowerCase()
  if (k === 'admin') return ShieldCheck
  if (k === 'sales') return Users
  if (k === 'editor') return Pencil
  if (k === 'viewer') return Eye
  return Users
}

function iconWrapClass(key: string): string {
  const k = key.toLowerCase()
  if (k === 'admin') return 'bg-primary/10 text-primary'
  if (k === 'sales') return 'bg-tertiary-fixed text-tertiary'
  if (k === 'editor') return 'bg-secondary-fixed text-secondary'
  if (k === 'viewer') return 'bg-surface-container-high text-on-surface-variant'
  return 'bg-surface-container-high text-primary'
}

export function AdminRbacRoleMatrixCards({
  matrix,
  isLoading,
  messages: m
}: {
  matrix: RbacMatrixResponse | undefined
  isLoading: boolean
  messages: RbacCardMessages
}) {
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState<Set<number>>(() => new Set())

  const toggle = (id: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredRoles = React.useMemo(() => {
    if (!matrix) return []
    const s = q.trim().toLowerCase()
    if (!s) return matrix.roles
    return matrix.roles.filter(
      (r) => r.name.toLowerCase().includes(s) || r.key.toLowerCase().includes(s)
    )
  }, [matrix, q])

  const exportJson = () => {
    if (!matrix) return
    const blob = new Blob([JSON.stringify(matrix, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rbac-matrix-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading && !matrix) {
    return (
      <div className="flex justify-center rounded-xl border border-outline/10 bg-surface-container-lowest p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  if (!matrix) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={m.searchPlaceholder}
            className="rounded-full border-none bg-surface-container-high pl-10 shadow-inner"
            aria-label={m.searchPlaceholder}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="rounded-xl font-semibold" onClick={exportJson}>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {m.exportMatrix}
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-gradient-to-br from-primary to-primary-container font-bold text-on-primary shadow-lg shadow-primary/20"
            onClick={() => toast.message(m.createRoleHint)}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {m.createRole}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRoles.map((role) => {
          const Icon = iconForRoleKey(role.key)
          const expanded = open.has(role.id)
          const count = roleUserCount(matrix, role.id)
          const rows = buildModuleMatrixForRole(matrix, role.id)
          const isAdminRole = role.key.toLowerCase() === 'admin'

          return (
            <div
              key={role.id}
              className="overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(role.id)}
                className="group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-surface-container-low md:p-6"
                aria-expanded={expanded}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      iconWrapClass(role.key)
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-on-surface md:text-xl">{role.name}</h3>
                      {isAdminRole ? (
                        <span className="rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                          {m.systemDefault}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-on-surface-variant">
                      {role.description ?? role.key}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-[10px] uppercase tracking-tighter text-outline">{m.assignedLabel}</div>
                    <div className="text-sm font-semibold text-on-surface">
                      {m.usersCount.replace('{count}', String(count))}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-outline transition-transform',
                      expanded && 'rotate-180 text-primary'
                    )}
                    aria-hidden
                  />
                </div>
              </button>

              {expanded ? (
                <div className="border-t border-outline/10 bg-surface-container-low p-5 md:p-8">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
                    <div className="lg:col-span-1">
                      <h4 className="font-bold text-on-surface">{m.moduleTitle}</h4>
                      <p className="mt-1 text-xs text-on-surface-variant">{m.moduleHint}</p>
                    </div>
                    <div className="lg:col-span-3">
                      {rows.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-outline/30 bg-surface-container-lowest px-4 py-8 text-center text-sm text-on-surface-variant">
                          {m.emptyRoleMatrix}
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-outline/10 bg-surface-container-lowest">
                          <table className="w-full min-w-[480px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-outline/10 font-mono text-[10px] uppercase tracking-widest text-outline">
                                <th className="px-4 py-3">{m.colModule}</th>
                                <th className="px-2 py-3 text-center">{m.colView}</th>
                                <th className="px-2 py-3 text-center">{m.colEdit}</th>
                                <th className="px-2 py-3 text-center">{m.colDelete}</th>
                                <th className="px-2 py-3 text-center">{m.colApprove}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline/10">
                              {rows.map((row) => (
                                <tr key={row.module}>
                                  <td className="px-4 py-3 font-semibold capitalize text-on-surface">{row.module}</td>
                                  <td className="px-2 py-3 text-center">
                                    <Cell on={row.view} />
                                  </td>
                                  <td className="px-2 py-3 text-center">
                                    <Cell on={row.edit} />
                                  </td>
                                  <td className="px-2 py-3 text-center">
                                    <Cell on={row.delete} />
                                  </td>
                                  <td className="px-2 py-3 text-center">
                                    <Cell on={row.approve} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-on-surface-variant">{m.expandDetails}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Cell({ on }: { on: boolean }) {
  return on ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-primary" aria-label="Granted" />
  ) : (
    <span className="mx-auto block h-2 w-2 rounded-full bg-outline-variant/40" aria-label="Not granted" />
  )
}
