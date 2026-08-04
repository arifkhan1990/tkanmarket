'use client'

import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { AdminRbacRoleMatrixCards } from '@/components/admin/access/AdminRbacRoleMatrixCards'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useRbacMatrixQuery, useRbacUserRoleMutations, useUserRolesQuery } from '@/hooks/admin/useRbacAdmin'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminRbacRolesTabContent() {
  const { messages } = useI18n()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const m = messages.admin.userManagement
  const rbac = messages.admin.rbacPage

  const usersQuery = useAdminUsers({ scope: 'all' })
  const rbacMatrixQuery = useRbacMatrixQuery()
  const { assign, remove } = useRbacUserRoleMutations()

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const userRolesQuery = useUserRolesQuery(selectedUserId)
  const [assignRoleId, setAssignRoleId] = useState<string>('')

  const matrix = rbacMatrixQuery.data
  const users = usersQuery.data ?? []

  const cardMessages = {
    searchPlaceholder: rbac.searchPlaceholder,
    exportMatrix: rbac.exportMatrix,
    createRole: rbac.createRole,
    createRoleHint: rbac.createRoleHint,
    assignedLabel: rbac.assignedLabel,
    usersCount: rbac.usersCount,
    moduleTitle: rbac.moduleMatrixTitle,
    moduleHint: rbac.moduleMatrixHint,
    colModule: rbac.colModule,
    colView: rbac.colView,
    colEdit: rbac.colEdit,
    colDelete: rbac.colDelete,
    colApprove: rbac.colApprove,
    systemDefault: rbac.systemDefaultBadge,
    expandDetails: rbac.matrixFootnote,
    emptyRoleMatrix: rbac.emptyRoleMatrix
  }

  return (
    <div className="space-y-12">
      <AdminRbacRoleMatrixCards
        matrix={matrix}
        isLoading={rbacMatrixQuery.isLoading}
        messages={cardMessages}
      />

      {isAdmin && (
        <section className="border-t border-outline/10 pt-10">
          <h2 className="font-heading text-xl font-bold text-on-surface md:text-2xl">{rbac.userRolesTitle}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{rbac.userRolesSubtitle}</p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-[200px]">
              <span className="text-sm font-medium text-on-surface">{rbac.selectUser}</span>
              <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={(v) => setSelectedUserId(Number(v))}>
                <SelectTrigger className="mt-1 rounded-xl border-outline/20">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <span className="text-sm font-medium text-on-surface">{rbac.selectRole}</span>
              <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                <SelectTrigger className="mt-1 rounded-xl border-outline/20">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {matrix?.roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!selectedUserId || !assignRoleId || assign.isPending}
              onClick={async () => {
                if (!selectedUserId || !assignRoleId) return
                await assign.mutateAsync({
                  userId: selectedUserId,
                  roleId: Number(assignRoleId)
                })
                setAssignRoleId('')
              }}
            >
              {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : rbac.assign}
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low/90 hover:bg-surface-container-low/90">
                  <TableHead className="text-on-surface">{rbac.colRole}</TableHead>
                  <TableHead className="text-right text-on-surface">{m.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedUserId && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-on-surface-variant">
                      {rbac.emptyAssignments}
                    </TableCell>
                  </TableRow>
                )}
                {selectedUserId && userRolesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {selectedUserId && !userRolesQuery.isLoading && (userRolesQuery.data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-on-surface-variant">
                      {rbac.emptyAssignments}
                    </TableCell>
                  </TableRow>
                )}
                {userRolesQuery.data?.map((ur) => (
                  <TableRow key={ur.id} className="border-outline/10">
                    <TableCell>
                      <span className="font-medium text-on-surface">{ur.role_name}</span>
                      <span className="ml-2 font-mono text-xs text-on-surface-variant">({ur.role_key})</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn('text-error hover:bg-error/10 hover:text-error')}
                        disabled={remove.isPending}
                        onClick={() => selectedUserId && remove.mutate({ userRoleId: ur.id, userId: selectedUserId })}
                      >
                        {rbac.remove}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}
