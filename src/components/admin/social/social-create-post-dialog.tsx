'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminSocialCreatePostInput } from '@/types/admin-social.types'

type Platform = AdminSocialCreatePostInput['platform']
type ContentType = NonNullable<AdminSocialCreatePostInput['content_type']>

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'YOUTUBE', label: 'YouTube' }
]

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'IMAGE_POST', label: 'Image post' },
  { value: 'PIN', label: 'Pin' },
  { value: 'REEL_5', label: 'Reel 5s' },
  { value: 'REEL_8', label: 'Reel 8s' },
  { value: 'REEL_10', label: 'Reel 10s' }
]

export interface SocialCreatePostDialogProps {
  initialPlatform: Platform
  triggerLabel: string
  onCreate: (input: AdminSocialCreatePostInput) => Promise<{ id: number }>
  isPending: boolean
}

export function SocialCreatePostDialog({ initialPlatform, triggerLabel, onCreate, isPending }: SocialCreatePostDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [fabricIdText, setFabricIdText] = React.useState('')
  const [platform, setPlatform] = React.useState<Platform>(initialPlatform)
  const [contentType, setContentType] = React.useState<ContentType>('CAROUSEL')

  React.useEffect(() => {
    if (open) setPlatform(initialPlatform)
  }, [initialPlatform, open])

  const fabricId = Number(fabricIdText)
  const canSubmit = Number.isInteger(fabricId) && fabricId > 0 && !isPending

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    const created = await onCreate({
      fabric_id: fabricId,
      platform,
      content_type: contentType
    })

    setOpen(false)
    setFabricIdText('')
    router.push(`/admin/social/${created.id}/preview`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2 rounded-xl shadow-md shadow-primary/15">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        overlayClassName="bg-black/0 backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle>Create social post</DialogTitle>
          <DialogDescription>Select a fabric ID and content type to create a new draft.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Platform</p>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Fabric ID</p>
            <Input
              inputMode="numeric"
              placeholder="e.g. 123"
              value={fabricIdText}
              onChange={(ev) => setFabricIdText(ev.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Content type</p>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPE_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={!canSubmit}>
              Create draft
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

