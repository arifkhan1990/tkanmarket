'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import * as React from 'react'

import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { serializeJsonLd } from '@/lib/utils/serialize-json'

export interface BreadcrumbItem {
  label: string
  href?: string
}

/** Parent crumbs: muted gray; current crumb styled separately */
const crumbLinkClass =
  'inline-flex max-w-full items-center leading-none text-[11px] font-medium uppercase tracking-[0.14em] text-on-surface-variant/55 transition-colors hover:text-primary sm:text-xs dark:text-on-surface-variant/50'

const crumbCurrentClass =
  'inline-flex max-w-full min-w-0 items-center leading-none text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface sm:text-xs'

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const { messages } = useI18n()
  const [origin, setOrigin] = React.useState<string>('')

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const breadcrumbList = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@id': item.href ? new URL(item.href, origin || 'http://localhost').toString() : undefined,
      name: item.label
    }
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbList
  }

  return (
    <>
      <nav
        aria-label={messages.a11y.breadcrumb}
        className={cn('w-full min-w-0 text-left', className)}
      >
        <ol
          className={cn(
            'm-0 flex w-full list-none flex-wrap items-center justify-start gap-x-1.5 gap-y-2 p-0 pl-0',
            'md:gap-x-2'
          )}
        >
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <React.Fragment key={`${item.label}-${idx}`}>
                {idx > 0 ? (
                  <li className="flex shrink-0 list-none items-center p-0" aria-hidden>
                    <ChevronRight
                      className="h-3 w-3 shrink-0 text-on-surface-variant/40 dark:text-on-surface-variant/35"
                      strokeWidth={2.25}
                    />
                  </li>
                ) : null}
                <li
                  className={cn(
                    'list-none p-0 text-left',
                    isLast ? 'min-w-0 flex-1 basis-0' : 'shrink-0'
                  )}
                >
                  {item.href && !isLast ? (
                    <Link href={item.href} className={crumbLinkClass}>
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(crumbCurrentClass, isLast && 'block w-full min-w-0 truncate text-left')}
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              </React.Fragment>
            )
          })}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    </>
  )
}
