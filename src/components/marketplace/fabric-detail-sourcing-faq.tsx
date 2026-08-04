import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

export type FabricDetailSourcingFaqItem = {
  question: string
  answer: string
}

type AccordionProps = {
  items: readonly FabricDetailSourcingFaqItem[]
  defaultOpenFirst?: boolean
}

/**
 * Flat FAQ (no outer card): same tokens as {@link FaqSection} rows — outline dividers, primary/10 plus.
 */
export function FabricDetailSourcingFaqAccordion({ items, defaultOpenFirst = true }: AccordionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="w-full min-w-0 divide-y divide-outline/10">
      {items.map((item, idx) => (
        <details
          key={`${idx}-${item.question.slice(0, 48)}`}
          open={defaultOpenFirst && idx === 0}
          className={cn('group [&_summary::-webkit-details-marker]:hidden')}
        >
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-6 px-0 py-5 text-left',
              'text-sm font-extrabold text-on-surface',
              'transition-colors hover:bg-surface-container-low/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
            )}
          >
            <span className="min-w-0 flex-1">{item.question}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-open:rotate-45">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
          </summary>
          <hr className="m-0 border-0 border-t border-outline/10" />
          <div className="pb-5 pt-0">
            <p className="m-0 text-sm leading-relaxed text-on-surface-variant">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  )
}
