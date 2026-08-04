import Link from 'next/link'

import { cn } from '@/lib/utils'
import { BLOG_TOPIC_PARAM, type BlogTopicParam } from '@/lib/blog-topics'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

type TopicRow = { key: BlogTopicParam; label: string }

type Props = {
  locale: Locale
  topicsLabel: string
  topics: TopicRow[]
  active: BlogTopicParam
}

export function BlogTopicFilters({ locale, topicsLabel, topics, active }: Props) {
  const base = withLocaleUrl('/blog', locale)

  return (
    <section className="w-full">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <span className="mr-1 text-xs font-bold uppercase tracking-widest text-on-surface/50 md:mr-2">{topicsLabel}</span>
        {topics.map((t) => {
          const href = t.key === BLOG_TOPIC_PARAM.all ? base : `${base}?topic=${t.key}`
          const isActive = active === t.key
          return (
            <Link
              key={t.key}
              href={href}
              scroll={false}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors md:px-6',
                isActive
                  ? 'bg-primary text-on-primary shadow-soft'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container dark:hover:bg-surface-container-high'
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
