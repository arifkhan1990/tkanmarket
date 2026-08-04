'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Plus } from 'lucide-react'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useAdminUserMutations } from '@/hooks/admin/useAdminUserMutations'
import { AdminInvitesPanel } from '@/components/admin/access/AdminInvitesPanel'
import { AdminRbacRolesTabContent } from '@/components/admin/access/AdminRbacRolesTabContent'
import { AdminAccessInsightsCards } from '@/components/admin/access/AdminAccessInsightsCards'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { AdminUserOption } from '@/types/admin-users.types'

function roleLabel(
  role: string,
  m: {
    roleAdmin: string
    roleSales: string
    roleViewer: string
  }
) {
  if (role === 'ADMIN') return m.roleAdmin
  if (role === 'SALES') return m.roleSales
  return m.roleViewer
}

export function AdminAccessClient() {
  const { messages } = useI18n()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const m = messages.admin.userManagement
  const access = messages.admin.accessPage

  const usersQuery = useAdminUsers({ scope: 'all' })
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUserOption | null>(null)

  const [formEmail, setFormEmail] = useState('')
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>('SALES')
  const [formPassword, setFormPassword] = useState('')

  const { createUser, updateUser, deactivateUser } = useAdminUserMutations()

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'SALES' | 'VIEWER'>('ALL')
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 8

  const filteredUsers = useMemo(() => {
    const term = searchText.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (term === '') return true
      const idStr = String(u.id)
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || idStr.includes(term)
    })
  }, [roleFilter, searchText, users])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)

  const paginatedUsers = useMemo(() => {
    const start = safePageIndex * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, pageSize, safePageIndex])

  const rangeStart = filteredUsers.length === 0 ? 0 : safePageIndex * pageSize + 1
  const rangeEnd = Math.min(filteredUsers.length, (safePageIndex + 1) * pageSize)

  const resetCreateForm = () => {
    setFormEmail('')
    setFormName('')
    setFormRole('SALES')
    setFormPassword('')
  }

  const openEdit = (u: AdminUserOption) => {
    setEditing(u)
    setFormName(u.name)
    setFormRole(u.role)
    setFormPassword('')
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{access.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{access.subtitle}</p>
        </div>
        <div className="hidden rounded-full bg-surface-container-highest border border-outline/10 px-4 py-2 sm:block">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">RBAC</span>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className={cn('mb-6 grid w-full max-w-2xl gap-1', isAdmin ? 'grid-cols-3' : 'grid-cols-2')}>
          <TabsTrigger value="users">{access.tabUsers}</TabsTrigger>
          <TabsTrigger value="roles">{access.tabRoles}</TabsTrigger>
          {isAdmin && <TabsTrigger value="invites">{access.tabInvites}</TabsTrigger>}
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-on-surface-variant">{m.title}</p>
            {isAdmin && (
              <Dialog
                open={createOpen}
                onOpenChange={(o) => {
                  setCreateOpen(o)
                  if (!o) resetCreateForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button type="button" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {m.addUser}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{m.createTitle}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <label htmlFor="cu-email" className="text-sm font-medium text-on-surface">
                        {m.emailLabel}
                      </label>
                      <Input
                        id="cu-email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="cu-name" className="text-sm font-medium text-on-surface">
                        {m.nameLabel}
                      </label>
                      <Input
                        id="cu-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">{m.colRole}</span>
                      <Select
                        value={formRole}
                        onValueChange={(v) => setFormRole(v as typeof formRole)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">{m.roleAdmin}</SelectItem>
                          <SelectItem value="SALES">{m.roleSales}</SelectItem>
                          <SelectItem value="VIEWER">{m.roleViewer}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="cu-pw" className="text-sm font-medium text-on-surface">
                        {m.passwordOptional}
                      </label>
                      <Input
                        id="cu-pw"
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      {m.cancel}
                    </Button>
                    <Button
                      type="button"
                      disabled={createUser.isPending}
                      onClick={async () => {
                        await createUser.mutateAsync({
                          email: formEmail,
                          name: formName,
                          role: formRole,
                          password: formPassword || undefined
                        })
                        setCreateOpen(false)
                        resetCreateForm()
                      }}
                    >
                      {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : m.createSubmit}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setPageIndex(0)
                }}
                placeholder="Search by name, email, or ID..."
                className="w-full rounded-xl border border-outline/15 bg-surface-container-lowest px-4 py-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-outline" aria-hidden>
                <span className="text-[12px] font-mono">{filteredUsers.length}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ADMIN', 'SALES', 'VIEWER'] as const).map((r) => {
                const active = roleFilter === r
                const label = r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? m.roleAdmin : r === 'SALES' ? m.roleSales : m.roleViewer
                return (
                  <Button
                    key={r}
                    type="button"
                    variant={active ? 'secondary' : 'outline'}
                    className="h-10 rounded-full px-4"
                      onClick={() => {
                        setRoleFilter(r)
                        setPageIndex(0)
                      }}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <AdminAccessInsightsCards />

          <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low">
                  <TableHead>{m.colName}</TableHead>
                  <TableHead>{m.colEmail}</TableHead>
                  <TableHead>{m.colRole}</TableHead>
                  {isAdmin && <TableHead className="text-right">{m.colActions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-outline" />
                    </TableCell>
                  </TableRow>
                )}
                {!usersQuery.isLoading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-on-surface-variant">
                      {m.empty}
                    </TableCell>
                  </TableRow>
                )}
                {paginatedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{roleLabel(u.role, m)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          {m.edit}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => deactivateUser.mutate(u.id)}
                          disabled={deactivateUser.isPending}
                        >
                          {m.deactivate}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-on-surface-variant">
              Showing{' '}
              <span className="font-mono">
                {rangeStart}-{rangeEnd}
              </span>{' '}
              of <span className="font-mono">{filteredUsers.length}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4"
                onClick={() => setPageIndex(Math.max(0, safePageIndex - 1))}
                disabled={safePageIndex <= 0}
              >
                Prev
              </Button>
              <div className="font-mono text-sm text-on-surface-variant">
                Page {safePageIndex + 1} / {pageCount}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4"
                onClick={() => setPageIndex(Math.min(pageCount - 1, safePageIndex + 1))}
                disabled={safePageIndex >= pageCount - 1}
              >
                Next
              </Button>
            </div>
          </div>

          <Dialog
            open={editOpen}
            onOpenChange={(o) => {
              setEditOpen(o)
              if (!o) setEditing(null)
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{m.updateTitle}</DialogTitle>
              </DialogHeader>
              {editing && (
                <>
                  <div className="space-y-4 py-2">
                    <p className="text-sm text-on-surface-variant">{editing.email}</p>
                    <div>
                      <label htmlFor="eu-name" className="text-sm font-medium text-on-surface">
                        {m.nameLabel}
                      </label>
                      <Input
                        id="eu-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">{m.colRole}</span>
                      <Select
                        value={formRole}
                        onValueChange={(v) => setFormRole(v as typeof formRole)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">{m.roleAdmin}</SelectItem>
                          <SelectItem value="SALES">{m.roleSales}</SelectItem>
                          <SelectItem value="VIEWER">{m.roleViewer}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="eu-pw" className="text-sm font-medium text-on-surface">
                        {m.passwordOptional}
                      </label>
                      <Input
                        id="eu-pw"
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                      {m.cancel}
                    </Button>
                    <Button
                      type="button"
                      disabled={updateUser.isPending}
                      onClick={async () => {
                        if (!editing) return
                        await updateUser.mutateAsync({
                          id: editing.id,
                          body: {
                            name: formName,
                            role: formRole,
                            password: formPassword || undefined
                          }
                        })
                        setEditOpen(false)
                        setEditing(null)
                      }}
                    >
                      {updateUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : m.updateSubmit}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="roles" className="space-y-8">
          <AdminRbacRolesTabContent />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="invites">
            <AdminInvitesPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
