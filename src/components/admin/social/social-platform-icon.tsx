'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type SocialPlatformKey = 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'

export interface SocialPlatformIconProps extends React.SVGProps<SVGSVGElement> {
  platform: SocialPlatformKey
}

// Minimal, recognizable brand glyphs (SVG path) rendered via currentColor.
// We keep them inline to avoid adding icon packages.
export function SocialPlatformIcon({ platform, className, ...props }: SocialPlatformIconProps) {
  switch (platform) {
    case 'INSTAGRAM':
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn('h-4 w-4', className)}
          {...props}
        >
          <path
            fill="currentColor"
            d="M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5Zm0 2A3 3 0 0 0 4.5 7.5v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-9Zm4.5 3.2a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm0 2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Zm5.2-2.65a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z"
          />
        </svg>
      )

    case 'TIKTOK':
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn('h-4 w-4', className)}
          {...props}
        >
          <path
            fill="currentColor"
            d="M14.6 3c.2 2.1 1.6 3.8 3.7 4.2v2.5c-1.4 0-2.7-.4-3.7-1.1v6.7a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v2.7a3.3 3.3 0 1 0 2.5 3.2V3h2.6Z"
          />
        </svg>
      )

    case 'PINTEREST':
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn('h-4 w-4', className)}
          {...props}
        >
          <path
            fill="currentColor"
            d="M12 2.5c-5.2 0-9.5 4.1-9.5 9.2 0 3.8 2.3 7.2 5.7 8.6-.1-.7-.2-1.9 0-2.7l1.4-5.7s-.4-.8-.4-2c0-1.9 1.1-3.3 2.5-3.3 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.6-.3 1.3.7 2.3 2 2.3 2.4 0 4.2-2.5 4.2-6.1 0-3.2-2.3-5.4-5.6-5.4-3.8 0-6 2.9-6 5.9 0 1.2.5 2.4 1 3.1.1.1.1.2.1.4l-.4 1.5c-.1.5-.3.6-.7.4-1.5-.7-2.4-2.9-2.4-4.6 0-3.7 2.7-7.1 7.8-7.1 4.1 0 7.3 2.9 7.3 6.8 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.8-1.4l-.7 2.6c-.2.9-.8 2-1.1 2.7.8.3 1.7.4 2.6.4 5.2 0 9.5-4.1 9.5-9.2S17.2 2.5 12 2.5Z"
          />
        </svg>
      )

    case 'FACEBOOK':
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn('h-4 w-4', className)}
          {...props}
        >
          <path
            fill="currentColor"
            d="M13.6 21.5v-7.1h2.4l.4-2.8h-2.8V9.8c0-.8.2-1.4 1.4-1.4h1.5V5.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v2.8h2.3v7.1h3.3Z"
          />
        </svg>
      )

    case 'YOUTUBE':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn('h-4 w-4', className)}
          {...props}
        >
          <path
            fill="currentColor"
            d="M21.6 7.1a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.4A2.7 2.7 0 0 0 2.4 7.1 28.4 28.4 0 0 0 2 12c0 1.7.1 3.3.4 4.9.2.9 1 1.7 1.9 1.9 1.7.4 7.7.4 7.7.4s6 0 7.7-.4c.9-.2 1.7-1 1.9-1.9.3-1.6.4-3.2.4-4.9 0-1.7-.1-3.3-.4-4.9ZM10.4 15.2V8.8L16 12l-5.6 3.2Z"
          />
        </svg>
      )
  }
}

