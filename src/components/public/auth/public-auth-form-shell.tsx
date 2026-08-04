'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { PublicAuthBackdrop } from '@/components/public/auth/public-auth-backdrop'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/** Match Stitch / admin login primary actions (gradient, shadow, micro-interaction). */
export const authPublicPrimaryCtaClass =
  'primary-gradient h-auto w-full rounded-xl py-4 font-heading text-base font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70'

export function PublicAuthFormShell({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative mx-auto max-w-lg px-6 py-12 md:py-16">
      <PublicAuthBackdrop />
      <div
        className={cn(
          'glass-card relative z-10 rounded-[2rem] border border-white/40 p-10 shadow-xl shadow-on-surface/5 dark:border-white/10',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function AuthBackToLoginLink() {
  const { messages } = useI18n()
  const a = messages.authPublic

  return (
    <div className="mt-8 border-t border-outline-variant/15 pt-8 text-center">
      <Link
        href="/admin/login"
        className="inline-flex items-center justify-center gap-2 font-semibold text-primary transition-colors hover:text-primary-container"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {a.backToLogin}
      </Link>
    </div>
  )
}
