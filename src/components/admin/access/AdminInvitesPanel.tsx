'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { useAdminInvitesQuery, useAdminInviteMutations } from '@/hooks/admin/useAdminInvites'
import { useI18n } from '@/hooks/useI18n'

export function AdminInvitesPanel() {
  const { messages } = useI18n()
  const p = messages.admin.invitesPanel
  const um = messages.admin.userManagement

  const query = useAdminInvitesQuery(true)
  const { send } = useAdminInviteMutations()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>('VIEWER')

  const rows = query.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-heading font-bold text-on-surface">{p.title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{p.subtitle}</p>
        <div className="mt-4 flex max-w-xl flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-[200px] flex-1">
            <span className="text-sm font-medium text-on-surface">{p.emailLabel}</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" type="email" />
          </div>
          <div className="min-w-[160px]">
            <span className="text-sm font-medium text-on-surface">{p.roleLabel}</span>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
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
            disabled={send.isPending || !email.trim()}
            onClick={() =>
              send.mutate(
                { email: email.trim(), role },
                {
                  onSuccess: () => setEmail('')
                }
              )
            }
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : p.sendInvite}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-container-low">
              <TableHead>{p.colEmail}</TableHead>
              <TableHead>{p.colRole}</TableHead>
              <TableHead>{p.colExpires}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!query.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-on-surface-variant">
                  {p.empty}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell className="font-mono text-xs">{format(new Date(r.expires_at), 'yyyy-MM-dd')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
