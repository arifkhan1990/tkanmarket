'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'

function stripLocalePrefix(path: string) {
  return path.replace(/^\/(en|ru|zh)(?=\/|$)/, '')
}

const LINKS = [
  { href: '/admin/crawler/control', key: 'control' as const },
  { href: '/admin/crawler/history', key: 'history' as const },
  { href: '/admin/job-queue', key: 'jobQueue' as const },
  { href: '/admin/crawler/settings', key: 'settings' as const },
  { href: '/admin/crawler/diagnostics', key: 'diagnostics' as const },
]

export function CrawlerSubNav() {
  const pathname = stripLocalePrefix(usePathname() ?? '')
  const { messages } = useI18n()
  const n = messages.admin.crawlerNav

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-outline/10 bg-surface-container-low/40 p-1.5"
      aria-label={messages.admin.crawlerPage.title}
    >
      {LINKS.map((link) => {
        const active =
          link.href === '/admin/job-queue'
            ? pathname === '/admin/job-queue' || pathname.startsWith('/admin/jobs')
            : pathname === link.href ||
              (link.href === '/admin/crawler/control' && pathname === '/admin/crawler')
        const label = n[link.key]
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-surface-container-lowest text-brand-700 shadow-sm border border-outline/10'
                : 'text-on-surface-variant hover:bg-surface-container-lowest/80 hover:text-on-surface'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
