'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocaleFromPathname } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

export type SupplierSuiteSubNavProps = {
  className?: string
}

export function SupplierSuiteSubNav({ className }: SupplierSuiteSubNavProps) {
  const pathname = usePathname()
  const { messages, locale: ctxLocale } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? ctxLocale ?? DEFAULT_LOCALE
  const m = messages.admin.supplierSuite

  const links = [
    {
      href: '/admin/suppliers',
      key: 'navDirectory' as const,
      match: (path: string) =>
        path === '/admin/suppliers' || path.endsWith('/admin/suppliers/')
    },
    /* {
      href: '/admin/suppliers/analytics',
      key: 'navAnalytics' as const,
      match: (path: string) => path.includes('/admin/suppliers/analytics')
    },
    {
      href: '/admin/suppliers/compliance',
      key: 'navCompliance' as const,
      match: (path: string) => path.includes('/admin/suppliers/compliance')
    }, */
    {
      href: '/admin/supplier-reviews',
      key: 'navReviews' as const,
      match: (path: string) => path.includes('/admin/supplier-reviews')
    },
    {
      href: '/admin/supplier-verification',
      key: 'navVerification' as const,
      match: (path: string) => path.includes('/admin/supplier-verification')
    },
    /* {
      href: '/admin/suppliers/performance-matrix',
      key: 'navPerformance' as const,
      match: (p: string) => p.includes('/admin/suppliers/performance-matrix')
    },
    {
      href: '/admin/suppliers/scorecard',
      key: 'navScorecard' as const,
      match: (p: string) =>
        p.includes('/admin/suppliers/scorecard') && !p.includes('/admin/suppliers/scorecard/benchmark')
    },
    {
      href: '/admin/suppliers/scorecard/benchmark',
      key: 'navBenchmark' as const,
      match: (p: string) => p.includes('/admin/suppliers/scorecard/benchmark')
    },
    { href: '/admin/suppliers/payouts', key: 'navPayouts' as const, match: (p: string) => p.includes('/admin/suppliers/payouts') },
    {
      href: '/admin/suppliers/withdrawals',
      key: 'navWithdrawals' as const,
      match: (p: string) =>
        p.includes('/admin/suppliers/withdrawals') || p.includes('/admin/supplier-withdrawals')
    },
    {
      href: '/admin/suppliers/onboarding',
      key: 'navOnboarding' as const,
      match: (p: string) => p.includes('/admin/suppliers/onboarding')
    } */
  ]

  const stripped = pathname.replace(/^\/(en|ru|zh)(?=\/|$)/, '')

  return (
    <nav
      className={cn(
        'mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-low/50 p-2 shadow-sm md:flex-wrap dark:border-outline/15',
        className
      )}
      aria-label={m.subnavAria}
    >
      {links.map((l) => {
        const active = l.match(stripped)
        const label = m[l.key]
        return (
          <Link
            key={l.href}
            href={withLocaleUrl(l.href, locale)}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary text-white shadow-sm hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
