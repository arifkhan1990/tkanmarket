'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Edit2, Loader2, Plus, Search } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useAdminInvitesQuery, useAdminInviteMutations } from '@/hooks/admin/useAdminInvites'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useAdminUserMutations } from '@/hooks/admin/useAdminUserMutations'
import { useRbacMatrixQuery } from '@/hooks/admin/useRbacAdmin'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { cn } from '@/lib/utils'
import type { AdminUserOption } from '@/types/admin-users.types'

type TabKey = 'all' | 'pending' | 'deactivated'

function roleLabel(
  role: string,
  m: { roleAdmin: string; roleSales: string; roleViewer: string }
) {
  if (role === 'ADMIN') return m.roleAdmin
  if (role === 'SALES') return m.roleSales
  return m.roleViewer
}

export function AdminUserAccessManagementClient() {
  const { messages } = useI18n()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const um = messages.admin.userManagement
  const p = messages.admin.userAccessPage

  const [tab, setTab] = useState<TabKey>('all')
  const activeQuery = useAdminUsers({ scope: 'all' })
  const deactivatedQuery = useAdminUsers({ scope: 'all', status: 'deactivated' })
  const invitesQuery = useAdminInvitesQuery(Boolean(isAdmin))
  const rbacQuery = useRbacMatrixQuery()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 8

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUserOption | null>(null)
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>('SALES')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>('VIEWER')

  const { updateUser } = useAdminUserMutations()
  const { send } = useAdminInviteMutations()

  const list = useMemo(() => {
    if (tab === 'deactivated') return deactivatedQuery.data ?? []
    if (tab === 'pending') return []
    return activeQuery.data ?? []
  }, [tab, deactivatedQuery.data, activeQuery.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (tab === 'pending') return []
    return list.filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      )
    })
  }, [list, search, tab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const totalUsers = activeQuery.data?.length ?? 0
  const roleCount = rbacQuery.data?.roles.length ?? 0

  const openEdit = (u: AdminUserOption) => {
    setEditing(u)
    setFormName(u.name)
    setFormRole(u.role)
    setEditOpen(true)
  }

  const pendingCount = isAdmin ? invitesQuery.data?.length ?? 0 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.heroTitle}</h1>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              {p.proBadge}
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">{p.heroSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/roles-permissions">{p.rbacLink}</Link>
          </Button>
          {isAdmin ? (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-gradient-to-br from-primary to-primary/90 font-bold shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  {p.inviteMember}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{messages.admin.invitesPanel.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-on-surface">{messages.admin.invitesPanel.emailLabel}</span>
                    <Input
                      className="mt-1"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-on-surface">{messages.admin.invitesPanel.roleLabel}</span>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">{um.roleAdmin}</SelectItem>
                        <SelectItem value="SALES">{um.roleSales}</SelectItem>
                        <SelectItem value="VIEWER">{um.roleViewer}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    disabled={send.isPending || !inviteEmail.trim()}
                    onClick={() =>
                      send.mutate(
                        { email: inviteEmail.trim(), role: inviteRole },
                        {
                          onSuccess: () => {
                            setInviteEmail('')
                            setInviteOpen(false)
                          }
                        }
                      )
                    }
                  >
                    {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : messages.admin.invitesPanel.sendInvite}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DashboardStatCardShell tone="blue">
          <p className={dashboardStatLabelClass}>{p.statTotalUsers}</p>
          <p className={cn(dashboardStatValueClass, 'font-headline font-extrabold')}>{totalUsers}</p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="green">
          <p className={dashboardStatLabelClass}>{p.statActiveRoles}</p>
          <p className={cn(dashboardStatValueClass, 'font-headline font-extrabold')}>{roleCount}</p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="yellow" className="md:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={dashboardStatLabelClass}>{p.statSystemLoad}</p>
              <p className={cn(dashboardStatValueClass, 'font-headline font-extrabold')}>{p.loadStable}</p>
            </div>
            <div className="flex h-10 shrink-0 items-end gap-1">
              {[40, 55, 35, 65, 50].map((h, i) => (
                <div
                  key={i}
                  className={cn('w-1.5 rounded-full bg-primary/20', i === 4 && 'bg-primary')}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </DashboardStatCardShell>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-4 border-b border-outline/10 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'deactivated'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k)
                  setPage(0)
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  tab === k ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                {k === 'all' ? p.tabAll : k === 'pending' ? `${p.tabPending}${pendingCount ? ` (${pendingCount})` : ''}` : p.tabDeactivated}
              </button>
            ))}
          </div>
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden />
            <Input
              className="pl-9"
              placeholder={p.searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              disabled={tab === 'pending'}
            />
          </div>
        </div>

        {tab === 'pending' ? (
          <div className="p-6 text-sm text-on-surface-variant">
            {!isAdmin ? (
              p.invitesAdminOnly
            ) : invitesQuery.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (invitesQuery.data?.length ?? 0) === 0 ? (
              messages.admin.invitesPanel.empty
            ) : (
              <ul className="space-y-2">
                {invitesQuery.data?.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline/10 bg-surface-container-low px-4 py-3"
                  >
                    <span className="font-medium text-on-surface">{inv.email}</span>
                    <span className="text-xs text-on-surface-variant">{inv.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {p.colMember}
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {p.colRole}
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {p.colStatus}
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {p.colUserId}
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {p.colActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeQuery.isLoading || deactivatedQuery.isLoading) && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!activeQuery.isLoading &&
                  !deactivatedQuery.isLoading &&
                  pageRows.map((u) => (
                    <TableRow key={u.id} className="hover:bg-surface-container-low/80">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt=""
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-on-surface">{u.name}</p>
                            <p className="text-xs text-on-surface-variant">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                          {roleLabel(u.role, um)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              tab === 'deactivated' ? 'bg-outline' : 'bg-emerald-500'
                            )}
                          />
                          <span className="text-xs font-medium text-on-surface-variant">
                            {tab === 'deactivated' ? p.statusInactive : p.statusActive}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-[10px] text-on-surface-variant">USR-{u.id}</code>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && tab !== 'deactivated' ? (
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label={um.edit}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-2 border-t border-outline/10 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant md:flex-row md:items-center md:justify-between md:px-6">
              <p>
                {interpolate(p.showingRange, {
                  start: filtered.length === 0 ? 0 : safePage * pageSize + 1,
                  end: Math.min(filtered.length, (safePage + 1) * pageSize),
                  total: filtered.length
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ‹
                </Button>
                <Button type="button" variant="outline" size="sm">
                  {safePage + 1}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  ›
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{um.updateTitle}</SheetTitle>
          </SheetHeader>
          {editing ? (
            <div className="flex-1 space-y-6 overflow-y-auto py-4">
              <div>
                <span className="text-sm font-medium">{um.nameLabel}</span>
                <Input className="mt-1" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <span className="text-sm font-medium">{um.colRole}</span>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as typeof formRole)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{um.roleAdmin}</SelectItem>
                    <SelectItem value="SALES">{um.roleSales}</SelectItem>
                    <SelectItem value="VIEWER">{um.roleViewer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <SheetFooter className="gap-2 sm:flex-col">
            <Button
              type="button"
              disabled={!editing || updateUser.isPending}
              onClick={() => {
                if (!editing) return
                updateUser.mutate(
                  { id: editing.id, body: { name: formName, role: formRole } },
                  { onSuccess: () => setEditOpen(false) }
                )
              }}
            >
              {updateUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : um.updateSubmit}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
