'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export interface PrivacyTocItem {
  id: string
  label: string
}

type Props = {
  items: PrivacyTocItem[]
  tocTitle: string
  contactBody: string
  contactEmail: string
}

export function PrivacyPolicyToc({ items, tocTitle, contactBody, contactEmail }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    if (items.length === 0) return
    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el != null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const id = visible[0]?.target.id
        if (id) setActiveId(id)
      },
      { root: null, rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  return (
    <aside className="hidden shrink-0 md:block md:w-56 lg:w-64">
      <nav className="md:sticky md:top-32 space-y-1" aria-label={tocTitle}>
        <h2 className="mb-4 ml-1 text-xs font-black uppercase tracking-widest text-outline">{tocTitle}</h2>
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className={
                active
                  ? 'flex items-center rounded-xl bg-primary-fixed px-4 py-3 text-sm font-bold text-on-primary-fixed transition-colors'
                  : 'flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container'
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-10 rounded-2xl border border-outline/10 bg-surface-container-low p-6">
        <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
          {contactBody}{' '}
          <a className="font-bold text-primary hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </div>
    </aside>
  )
}
