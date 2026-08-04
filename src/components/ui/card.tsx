'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-3xl bg-surface-container-lowest', className)} {...props} />
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('p-6 pb-0', className)} {...props} />
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>
export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-6 pt-4', className)} {...props} />
}

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>
export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

