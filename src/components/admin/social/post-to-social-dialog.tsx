'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type SocialPlatform = 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string; icon: string; gradient: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸', gradient: 'from-rose-500 via-fuchsia-500 to-orange-400' },
  { value: 'TIKTOK',    label: 'TikTok',    icon: '🎵', gradient: 'from-slate-800 to-slate-600' },
  { value: 'PINTEREST', label: 'Pinterest', icon: '📌', gradient: 'from-red-600 to-red-500' },
  { value: 'FACEBOOK',  label: 'Facebook',  icon: '👍', gradient: 'from-blue-600 to-blue-500' },
  { value: 'YOUTUBE',   label: 'YouTube',   icon: '▶️', gradient: 'from-red-500 to-red-600' }
]

export interface PostToSocialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fabricId: number | null
  fabricTitle?: string
  /** If provided, dialog won't redirect — just calls this on success */
  onSuccess?: (createdIds: number[]) => void
  /** Default platforms to pre-select. Defaults to ['INSTAGRAM'] */
  defaultPlatforms?: SocialPlatform[]
}

export function PostToSocialDialog({
  open,
  onOpenChange,
  fabricId,
  fabricTitle = '',
  onSuccess,
  defaultPlatforms = ['INSTAGRAM']
}: PostToSocialDialogProps) {
  const router = useRouter()
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Set<SocialPlatform>>(
    new Set(defaultPlatforms)
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset selection every time the dialog opens
  React.useEffect(() => {
    if (open) setSelectedPlatforms(new Set(defaultPlatforms))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fabricId || selectedPlatforms.size === 0 || isSubmitting) return

    setIsSubmitting(true)
    const errors: string[] = []
    const createdIds: number[] = []

    await Promise.allSettled(
      [...selectedPlatforms].map(async (platform) => {
        try {
          const res = await fetch('/api/v1/admin/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fabric_id: fabricId, platform })
          })
          const json = await res.json()
          if (!res.ok || !json.success) {
            errors.push(`${platform}: ${json.error?.message ?? 'Failed'}`)
          } else {
            createdIds.push(json.data.id as number)
          }
        } catch {
          errors.push(`${platform}: Network error`)
        }
      })
    )

    setIsSubmitting(false)

    if (errors.length > 0) {
      toast.error(`Some platforms failed: ${errors.join(', ')}`)
    }

    if (createdIds.length > 0) {
      toast.success(
        `${createdIds.length} social draft${createdIds.length > 1 ? 's' : ''} created! AI content is being generated.`
      )
      onOpenChange(false)

      if (onSuccess) {
        onSuccess(createdIds)
      } else {
        router.push('/admin/social')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" aria-hidden />
              Post to Social Media
            </DialogTitle>
            <DialogDescription>
              Select the platforms to create AI-generated social drafts
              {fabricTitle ? (
                <>
                  {' '}for{' '}
                  <span className="font-semibold text-on-surface">{fabricTitle}</span>
                </>
              ) : null}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Select platforms *
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SOCIAL_PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.has(p.value)
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/8 shadow-sm'
                        : 'border-outline/15 bg-surface-container-low hover:border-outline/30 hover:bg-surface-container-high'
                    )}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm',
                        p.gradient,
                        'text-white'
                      )}
                    >
                      {p.icon}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-on-surface">{p.label}</span>
                    </span>
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-outline/30 bg-transparent'
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {selectedPlatforms.size === 0 && (
              <p className="text-xs text-destructive">Please select at least one platform.</p>
            )}

            <div className="rounded-xl border border-outline/10 bg-surface-container-low/60 p-3">
              <p className="text-xs leading-relaxed text-on-surface-variant">
                <Sparkles className="mr-1 inline h-3 w-3 text-primary" aria-hidden />
                AI will automatically generate captions, hashtags, and content for each selected
                platform. Drafts will appear in the Social queue for review.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl gap-2"
              disabled={isSubmitting || selectedPlatforms.size === 0}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Create {selectedPlatforms.size > 1 ? `${selectedPlatforms.size} Drafts` : 'Draft'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
