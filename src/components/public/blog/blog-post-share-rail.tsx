'use client'

import { useCallback, useState } from 'react'
import { Linkedin, Link as LinkIcon, Share2, Twitter } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

type Props = {
  title: string
  shareLabel: string
  copyLabel: string
  copiedLabel: string
  copyFailedLabel: string
  twitterLabel: string
  linkedinLabel: string
}

/**
 * Sticky share rail for the blog detail page.
 *
 * - Native Web Share API on supported browsers (mobile-first)
 * - Falls back to clipboard copy with toast feedback
 * - Twitter / LinkedIn intent buttons (popups, no PII leak)
 *
 * Pure client island — no API calls, no network access on mount.
 */
export function BlogPostShareRail({
  title,
  shareLabel,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  twitterLabel,
  linkedinLabel
}: Props) {
  // Lazy-init reads `window.location.href` exactly once during the first
  // client render — `'use client'` boundaries can still execute on the server,
  // so we guard with `typeof window` and fall back to an empty string for SSR.
  const [shareUrl] = useState<string>(() =>
    typeof window === 'undefined' ? '' : window.location.href
  )

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      const clipboard = (globalThis as { navigator?: Navigator }).navigator?.clipboard
      if (clipboard?.writeText) {
        await clipboard.writeText(shareUrl)
        return true
      }
    } catch {
      return false
    }
    return false
  }, [shareUrl])

  const onShare = useCallback(async () => {
    if (!shareUrl) return
    try {
      const nav = (globalThis as { navigator?: Navigator }).navigator
      if (nav && 'share' in nav && typeof nav.share === 'function') {
        await nav.share({ title, url: shareUrl })
        return
      }
    } catch {
      // user cancelled the system share sheet
    }
    if (await copyToClipboard()) {
      toast.success(copiedLabel)
      return
    }
    toast.error(copyFailedLabel)
  }, [shareUrl, title, copyToClipboard, copiedLabel, copyFailedLabel])

  const onCopy = useCallback(async () => {
    if (!shareUrl) return
    if (await copyToClipboard()) toast.success(copiedLabel)
    else toast.error(copyFailedLabel)
  }, [shareUrl, copyToClipboard, copiedLabel, copyFailedLabel])

  const twitterHref = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
    : '#'
  const linkedinHref = shareUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    : '#'

  const buttonClass = cn(
    'flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition-all',
    'hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  )

  return (
    <div
      className="flex items-center gap-2 lg:flex-col lg:gap-3"
      role="group"
      aria-label={shareLabel}
    >
      <button type="button" onClick={onShare} className={buttonClass} aria-label={shareLabel}>
        <Share2 className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" onClick={onCopy} className={buttonClass} aria-label={copyLabel}>
        <LinkIcon className="h-4 w-4" aria-hidden />
      </button>
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label={twitterLabel}
      >
        <Twitter className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={linkedinHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label={linkedinLabel}
      >
        <Linkedin className="h-4 w-4" aria-hidden />
      </a>
    </div>
  )
}
