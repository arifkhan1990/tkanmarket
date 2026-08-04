'use client'

import * as React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminFabricCreate, useAdminSupplierOptions } from '@/hooks/admin/useAdminFabricManagement'
import { useI18n } from '@/hooks/useI18n'

export function AdminFabricNewClient() {
  const { messages } = useI18n()
  const router = useRouter()
  const suppliers = useAdminSupplierOptions()
  const create = useAdminFabricCreate()

  const [supplierId, setSupplierId] = React.useState<string>('')
  const [titleRu, setTitleRu] = React.useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sid = Number(supplierId)
    if (!Number.isFinite(sid) || sid <= 0) {
      toast.error(messages.admin.fabrics.newFabricValidationSupplier)
      return
    }
    const title = titleRu.trim()
    if (title.length < 2) {
      toast.error(messages.admin.fabrics.newFabricValidationTitle)
      return
    }
    create.mutate(
      { supplierId: sid, titleRu: title },
      {
        onSuccess: (data) => {
          toast.success(messages.admin.fabrics.newFabricCreatedToast)
          router.push(`/admin/fabrics/${data.id}`)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : messages.admin.leadsTimeline.requestFailed)
        }
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" asChild className="rounded-xl">
          <Link href="/admin/fabrics" aria-label={messages.admin.fabrics.newFabricBack}>
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div>
          <h2 className="font-heading text-lg font-bold text-on-surface">{messages.admin.fabrics.newFabricPageTitle}</h2>
          <p className="text-sm text-on-surface-variant">{messages.admin.fabrics.newFabricPageSubtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-on-surface" id="admin-new-fabric-supplier-label">
          {messages.admin.fabrics.newFabricSupplier}
        </div>
        <Select value={supplierId} onValueChange={setSupplierId} disabled={suppliers.isPending}>
          <SelectTrigger
            id="admin-new-fabric-supplier"
            className="rounded-xl"
            aria-labelledby="admin-new-fabric-supplier-label"
          >
            <SelectValue placeholder={messages.admin.fabrics.newFabricSupplierPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {(suppliers.data ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-on-surface" id="admin-new-fabric-title-label">
          {messages.admin.fabrics.newFabricTitleLabel}
        </div>
        <Input
          id="admin-new-fabric-title"
          aria-labelledby="admin-new-fabric-title-label"
          value={titleRu}
          onChange={(e) => setTitleRu(e.target.value)}
          className="rounded-xl"
          minLength={2}
          required
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={create.isPending || suppliers.isPending} className="rounded-xl">
          {messages.admin.fabrics.newFabricSubmit}
        </Button>
        <Button type="button" variant="outline" asChild className="rounded-xl">
          <Link href="/admin/fabrics">{messages.admin.fabrics.newFabricBack}</Link>
        </Button>
      </div>
    </form>
  )
}
