'use client'

import Image from 'next/image'
import { Bookmark, Heart, MessageCircle, Send, Share2, ThumbsUp } from 'lucide-react'

import { cn } from '@/lib/utils'

export type PreviewMode = 'instagram' | 'tiktok' | 'pinterest' | 'facebook' | 'youtube'

type PreviewFramesProps = {
  mode: PreviewMode
  imageUrl: string | null
  caption: string
  displayName: string
  platformLabel: string
  tiktokLabels: { following: string; forYou: string }
  noImageLabel: string
}

/* ─── Frame media — renders <video> for reels, <Image> otherwise ─── */
function FrameMedia({ src, sizes }: { src: string; sizes: string }) {
  if (src.endsWith('.mp4')) {
    return <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
  }
  return (
    <Image src={src} alt="" fill className="object-cover" sizes={sizes} unoptimized={src.startsWith('http')} priority />
  )
}

/* ─── Fabric placeholder — shown when no image is available ──────── */
function FabricPlaceholder({ mode, noImageLabel }: { mode: PreviewMode; noImageLabel: string }) {
  const bg =
    mode === 'tiktok'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700'
      : mode === 'facebook'
        ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-400'
        : mode === 'youtube'
          ? 'bg-gradient-to-br from-red-600 via-red-500 to-rose-400'
          : mode === 'pinterest'
            ? 'bg-gradient-to-br from-red-600 via-rose-500 to-orange-400'
            : 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-orange-400'
  return (
    <div className={cn('flex h-full w-full flex-col items-center justify-center gap-3', bg)}>
      {/* Fabric weave SVG icon */}
      <svg viewBox="0 0 64 64" className="h-16 w-16 opacity-40 drop-shadow-lg" fill="none" aria-hidden>
        <rect x="4"  y="4"  width="12" height="12" rx="2" fill="white" />
        <rect x="20" y="4"  width="12" height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="36" y="4"  width="12" height="12" rx="2" fill="white" />
        <rect x="52" y="4"  width="8"  height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="4"  y="20" width="12" height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="20" y="20" width="12" height="12" rx="2" fill="white" />
        <rect x="36" y="20" width="12" height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="52" y="20" width="8"  height="12" rx="2" fill="white" />
        <rect x="4"  y="36" width="12" height="12" rx="2" fill="white" />
        <rect x="20" y="36" width="12" height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="36" y="36" width="12" height="12" rx="2" fill="white" />
        <rect x="52" y="36" width="8"  height="12" rx="2" fill="white" opacity="0.6" />
        <rect x="4"  y="52" width="12" height="8"  rx="2" fill="white" opacity="0.6" />
        <rect x="20" y="52" width="12" height="8"  rx="2" fill="white" />
        <rect x="36" y="52" width="12" height="8"  rx="2" fill="white" opacity="0.6" />
        <rect x="52" y="52" width="8"  height="8"  rx="2" fill="white" />
      </svg>
      <span className="text-[11px] font-semibold tracking-wide text-white/60">{noImageLabel}</span>
    </div>
  )
}

function InstagramFrame({ imageUrl, caption, displayName, platformLabel, noImageLabel }: Omit<PreviewFramesProps, 'mode' | 'tiktokLabels'>) {
  return (
    <div className="relative aspect-[9/16] w-[320px] max-w-full overflow-hidden rounded-[2.5rem] border-[8px] border-outline/20 bg-surface-container-highest shadow-2xl">
      {imageUrl ? (
        <FrameMedia src={imageUrl} sizes="320px" />
      ) : (
        <FabricPlaceholder mode="instagram" noImageLabel={noImageLabel} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 ring-2 ring-white/40" />
          <span className="text-xs font-bold">{displayName}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide opacity-90">{platformLabel}</span>
        </div>
        <p className="mb-4 line-clamp-4 text-[11px] leading-relaxed">{caption}</p>
        <div className="flex items-center justify-between text-white/85">
          <div className="flex gap-4">
            <Heart className="h-5 w-5" aria-hidden />
            <MessageCircle className="h-5 w-5" aria-hidden />
            <Send className="h-5 w-5" aria-hidden />
          </div>
          <Bookmark className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}

function TikTokFrame({ imageUrl, caption, displayName, tiktokLabels, noImageLabel }: Omit<PreviewFramesProps, 'mode' | 'platformLabel'>) {
  return (
    <div className="relative aspect-[9/16] w-[340px] max-w-full overflow-hidden rounded-[2.5rem] border-[10px] border-outline/20 bg-surface-container-highest shadow-2xl ring-4 ring-on-surface/5">
      {imageUrl ? (
        <FrameMedia src={imageUrl} sizes="340px" />
      ) : (
        <FabricPlaceholder mode="tiktok" noImageLabel={noImageLabel} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="mt-4 flex items-center justify-between text-xs font-bold">
          <span className="opacity-70">{tiktokLabels.following}</span>
          <span className="border-b-2 border-white pb-0.5">{tiktokLabels.forYou}</span>
          <Share2 className="h-5 w-5 opacity-80" aria-hidden />
        </div>
        <div className="mb-6 flex gap-3">
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-cyan-400 to-fuchsia-500" />
              <span className="font-bold">@{displayName.replace(/^@/, '')}</span>
            </div>
            <p className="line-clamp-4 text-sm leading-snug">{caption}</p>
          </div>
          <div className="flex flex-col items-center gap-5 pt-2">
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-full bg-white/15 p-2 backdrop-blur">
                <Heart className="h-5 w-5 fill-white" aria-hidden />
              </div>
              <span className="text-[10px] font-bold opacity-90">—</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-full bg-white/15 p-2 backdrop-blur">
                <MessageCircle className="h-5 w-5 fill-white" aria-hidden />
              </div>
              <span className="text-[10px] font-bold opacity-90">—</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/35" />
    </div>
  )
}

function PinterestFrame({ imageUrl, caption, displayName, platformLabel, noImageLabel }: Omit<PreviewFramesProps, 'mode' | 'tiktokLabels'>) {
  return (
    <div className="relative aspect-[2/3] w-[280px] max-w-full overflow-hidden rounded-2xl bg-surface-container-highest shadow-2xl">
      {imageUrl ? (
        <FrameMedia src={imageUrl} sizes="280px" />
      ) : (
        <FabricPlaceholder mode="pinterest" noImageLabel={noImageLabel} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
      {/* Save button */}
      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg">
        <Bookmark className="h-4 w-4 fill-red-600 text-red-600" aria-hidden />
      </div>
      {/* Pin title */}
      <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 px-3 py-2.5 text-slate-900 shadow-md">
        <div className="mb-1 flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-red-500" />
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{platformLabel}</span>
        </div>
        <p className="line-clamp-2 text-xs font-semibold leading-snug">{caption || displayName}</p>
      </div>
    </div>
  )
}

function FacebookFrame({ imageUrl, caption, displayName, platformLabel, noImageLabel }: Omit<PreviewFramesProps, 'mode' | 'tiktokLabels'>) {
  return (
    <div className="w-[min(100%,420px)] overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-2xl">
      {/* Post header */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500">
          <span className="text-xs font-bold text-white">{displayName.charAt(0).toUpperCase() || 'T'}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-on-surface">{displayName}</p>
          <p className="text-[10px] text-on-surface-variant">{platformLabel}</p>
        </div>
      </div>
      {/* Caption */}
      {caption ? <p className="px-3.5 pb-3 text-xs leading-relaxed text-on-surface">{caption}</p> : null}
      {/* Media */}
      <div className="relative aspect-video w-full bg-surface-container-high">
        {imageUrl ? (
          <FrameMedia src={imageUrl} sizes="420px" />
        ) : (
          <FabricPlaceholder mode="facebook" noImageLabel={noImageLabel} />
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-5 px-3.5 py-3 text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <ThumbsUp className="h-4 w-4 text-blue-500" aria-hidden /> Like
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <MessageCircle className="h-4 w-4" aria-hidden /> Comment
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Share2 className="h-4 w-4" aria-hidden /> Share
        </span>
      </div>
    </div>
  )
}

function YouTubeFrame({ imageUrl, caption, displayName, platformLabel, noImageLabel }: Omit<PreviewFramesProps, 'mode' | 'tiktokLabels'>) {
  return (
    <div className="w-[min(100%,440px)]">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-container-high shadow-2xl">
        {imageUrl ? (
          <FrameMedia src={imageUrl} sizes="440px" />
        ) : (
          <FabricPlaceholder mode="youtube" noImageLabel={noImageLabel} />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white">0:30</div>
      </div>
      {/* Meta row */}
      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600">
          <span className="text-xs font-bold text-white">{displayName.charAt(0).toUpperCase() || 'T'}</span>
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-on-surface">{caption || displayName}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {displayName} · {platformLabel}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SocialPreviewFrames(props: PreviewFramesProps) {
  switch (props.mode) {
    case 'instagram':
      return (
        <div className="flex justify-center">
          <InstagramFrame {...props} />
        </div>
      )
    case 'tiktok':
      return (
        <div className="flex justify-center">
          <TikTokFrame {...props} />
        </div>
      )
    case 'pinterest':
      return (
        <div className="flex justify-center">
          <PinterestFrame {...props} />
        </div>
      )
    case 'facebook':
      return (
        <div className="flex justify-center">
          <FacebookFrame {...props} />
        </div>
      )
    case 'youtube':
      return (
        <div className="flex justify-center">
          <YouTubeFrame {...props} />
        </div>
      )
  }
}
