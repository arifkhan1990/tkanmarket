'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type TocEntry = { id: string; label: string }

type Props = {
  title: string
  entries: TocEntry[]
}

/**
 * Scroll-spy table of contents.
 *
 * Uses an `IntersectionObserver` (cheap, no scroll listener) to highlight the
 * section closest to the top of the viewport. Pure client island, zero
 * network. Server fallback: first entry is highlighted before hydration.
 */
export function BlogPostToc({ title, entries }: Props) {
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '')

  useEffect(() => {
    if (entries.length === 0) return
    const targets: HTMLElement[] = []
    for (const entry of entries) {
      const el = document.getElementById(entry.id)
      if (el) targets.push(el)
    }
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (records) => {
        // Pick the topmost intersecting section so the highlight tracks the
        // user's reading position rather than the last one to enter the box.
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
        const topMost = visible[0]
        if (topMost) {
          setActiveId(topMost.target.id)
        }
      },
      {
        // Treat the top 30% of the viewport as the "active" zone.
        rootMargin: '-120px 0px -65% 0px',
        threshold: 0
      }
    )

    for (const t of targets) observer.observe(t)
    return () => observer.disconnect()
  }, [entries])

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveId(id)
  }

  if (entries.length === 0) return null

  return (
    <div>
      <h2 className="mb-6 font-heading text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
        {title}
      </h2>
      <ul className="space-y-3 border-l border-outline-variant/30 text-sm font-medium" role="list">
        {entries.map((item) => {
          const isActive = item.id === activeId
          return (
            <li
              key={item.id}
              className={cn(
                '-ml-px transition-all',
                isActive ? 'border-l-2 border-primary pl-4' : 'pl-4'
              )}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => onClick(e, item.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'block transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
