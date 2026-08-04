'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import Image from 'next/image'

import { cn, isRemoteImageSrc } from '@/lib/utils'

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

export const AvatarImage = ({
  className,
  src,
  alt
}: {
  className?: string
  src: string
  alt: string
}) => {
  return (
    <AvatarPrimitive.Image asChild>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className={cn('object-cover', className)}
        unoptimized={isRemoteImageSrc(src)}
      />
    </AvatarPrimitive.Image>
  )
}

export const AvatarFallback = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn('flex h-full w-full items-center justify-center bg-surface-container-lowest text-on-surface-variant', className)}
    {...props}
  >
    {children}
  </AvatarPrimitive.Fallback>
)

