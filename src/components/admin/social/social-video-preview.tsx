'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type VideoPreviewProps = {
  postId: number
  videoUrl: string | null
  thumbnailUrl: string | null
  status: string
  prompt: string
  caption?: string | null
  hashtags?: string[] | null
  reelScript?: string | null
  onApproved?: () => void
  onRejected?: () => void
}

export function SocialVideoPreview({ postId, videoUrl, thumbnailUrl, status, prompt, caption, hashtags, reelScript, onApproved, onRejected }: VideoPreviewProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)

  if (status !== 'VIDEO_PENDING' && status !== 'COMPLETED') return null

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => { setMessage(null); setMessageType(null) }, 4000)
  }

  const handleApprove = async () => {
    setIsSubmitting('approve')
    try {
      const res = await fetch(`/api/v1/admin/social/${postId}/approve-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      })
      if (!res.ok) throw new Error('Approval failed')
      showMsg('Video approved for publishing.', 'success')
      onApproved?.()
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to approve video', 'error')
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleReject = async () => {
    setIsSubmitting('reject')
    try {
      const res = await fetch(`/api/v1/admin/social/${postId}/approve-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, notes: notes || undefined })
      })
      if (!res.ok) throw new Error('Rejection failed')
      showMsg(notes ? `Rejected with notes: ${notes}` : 'Video rejected.', 'success')
      onRejected?.()
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to reject video', 'error')
    } finally {
      setIsSubmitting(null)
    }
  }

  const displayUrl = videoUrl ?? thumbnailUrl

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold">Video Preview</h3>
          {status === 'VIDEO_PENDING' && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Pending Review
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="relative aspect-[9/16] max-h-[400px] overflow-hidden rounded-lg bg-muted">
          {displayUrl ? (
            videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-contain"
                poster={thumbnailUrl ?? undefined}
              >
                <p>Your browser does not support video playback.</p>
              </video>
            ) : (
              <Image
                src={displayUrl}
                alt="Video thumbnail"
                fill
                sizes="400px"
                className="object-cover"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating video...
            </div>
          )}
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Generation Prompt</p>
          <p className="mt-1 text-sm">{prompt}</p>
        </div>

        {caption && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Generated Caption</p>
            <p className="mt-1 text-sm whitespace-pre-line">{caption}</p>
          </div>
        )}

        {hashtags && hashtags.length > 0 && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Hashtags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {hashtags.map((tag, idx) => (
                <span key={idx} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {reelScript && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Reel Script / Scene Direction</p>
            <p className="mt-1 text-sm whitespace-pre-line">{reelScript}</p>
          </div>
        )}

        <div>
          <label htmlFor="review-notes" className="text-xs font-medium text-muted-foreground">
            Review Notes (optional)
          </label>
          <Textarea
            id="review-notes"
            placeholder="Add notes about this video..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1"
            disabled={isSubmitting !== null}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isSubmitting !== null}
          className="flex-1"
        >
          {isSubmitting === 'reject' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Reject
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isSubmitting !== null}
          className="flex-1"
        >
          {isSubmitting === 'approve' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Approve
        </Button>
      </CardFooter>
    </Card>
  )
}
