'use client'

import * as React from 'react'
import { Archive, Edit3, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import {
  useAdminSocialCampaigns,
  useSocialCampaignMutations,
  type SocialCampaign
} from '@/hooks/admin/useAdminSocialCampaigns'

const STATUSES = ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const

function StatusBadge({ status }: { status: SocialCampaign['status'] }) {
  const intent: 'default' | 'success' | 'warning' | 'error' | 'brand' =
    status === 'ACTIVE'
      ? 'success'
      : status === 'PAUSED'
        ? 'warning'
        : status === 'COMPLETED'
          ? 'brand'
          : status === 'ARCHIVED'
            ? 'error'
            : 'default'
  return <Badge intent={intent}>{status}</Badge>
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function SocialCampaignsClient() {
  const query = useAdminSocialCampaigns()
  const { create, update, remove } = useSocialCampaignMutations()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState<{ name: string; description: string; status: SocialCampaign['status']; startsAt: string; endsAt: string }>({
    name: '',
    description: '',
    status: 'PLANNING',
    startsAt: '',
    endsAt: ''
  })

  const items: SocialCampaign[] = query.data?.success ? query.data.data.items : []

  function openCreate() {
    setEditingId(null)
    setForm({ name: '', description: '', status: 'PLANNING', startsAt: '', endsAt: '' })
    setDialogOpen(true)
  }

  function openEdit(campaign: SocialCampaign) {
    setEditingId(campaign.id)
    setForm({
      name: campaign.name,
      description: campaign.description ?? '',
      status: campaign.status,
      startsAt: campaign.startsAt ? campaign.startsAt.slice(0, 16) : '',
      endsAt: campaign.endsAt ? campaign.endsAt.slice(0, 16) : ''
    })
    setDialogOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined
    }
    if (editingId === null) {
      await create.mutateAsync(payload)
    } else {
      await update.mutateAsync({ id: editingId, ...payload })
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Social campaigns</h1>
          <p className="text-sm text-muted-foreground">Organize coordinated releases across platforms.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={submit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit campaign' : 'Create campaign'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  maxLength={5000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Starts</label>
                  <Input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ends</label>
                  <Input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as SocialCampaign['status'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading campaigns…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">No campaigns yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <StatusBadge status={c.status} />
                </div>
                {c.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p> : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-lg font-semibold">{c.postCount}</div>
                    <div className="text-muted-foreground">Posts</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{c.scheduledCount}</div>
                    <div className="text-muted-foreground">Scheduled</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{c.publishedCount}</div>
                    <div className="text-muted-foreground">Published</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <AdminDeleteConfirmDialog
                    title="Archive campaign?"
                    description="This will soft-archive the campaign. It will be hidden from active campaigns but can be restored later. All associated social posts will stop publishing."
                    confirmLabel="Archive campaign"
                    onConfirm={async () => {
                      await remove.mutateAsync(c.id)
                    }}
                  >
                    <Button variant="destructive" size="sm" disabled={remove.isPending}>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </Button>
                  </AdminDeleteConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
