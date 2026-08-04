'use client'

import { useState } from 'react'
import { Film, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { REEL_DURATIONS } from '@/constants'

type VideoGenerationDialogProps = {
  fabricId: number
  fabricTitle: string
  onGenerationStarted?: (result: { postId: number; mediaId: number }) => void
}

const DURATIONS = REEL_DURATIONS.map((d) => ({ value: String(d), label: `${d} seconds` }))

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram Reel' },
  { value: 'TIKTOK', label: 'TikTok' }
] as const

export function SocialVideoGenerationDialog({ fabricId, fabricTitle, onGenerationStarted }: VideoGenerationDialogProps) {
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState(String(REEL_DURATIONS[1]))
  const [platform, setPlatform] = useState('INSTAGRAM')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => { setMessage(null); setMessageType(null) }, 4000)
  }

  const handleGenerate = async () => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/v1/admin/social/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabric_id: fabricId,
          duration: Number(duration),
          platform
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Failed to start video generation')
      }

      const data = await res.json()
      setOpen(false)
      showMsg(`Video generation started for "${fabricTitle}". It may take 30-120 seconds.`, 'success')
      onGenerationStarted?.(data.data)
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to start video generation', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Film className="mr-2 h-4 w-4" />
          Generate Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Video for Fabric</DialogTitle>
          <DialogDescription>
            Create a short product video reel for &quot;{fabricTitle}&quot; using Veo AI.
            Videos require admin review and approval before publishing.
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Duration</p>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <Button
                  key={d.value}
                  type="button"
                  variant={duration === d.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(d.value)}
                  disabled={isSubmitting}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Platform</p>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant={platform === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlatform(p.value)}
                  disabled={isSubmitting}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Cost: ~${(Number(duration) * 0.04).toFixed(2)} per video (Veo 3.1 Lite).
            Daily limit: 20 videos. Monthly budget cap applies.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Film className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
