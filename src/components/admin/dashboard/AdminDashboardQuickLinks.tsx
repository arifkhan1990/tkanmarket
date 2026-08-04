import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export function AdminDashboardQuickLinks({
  title,
  links
}: {
  title: string
  links: Array<{ href: string; title: string; description: string }>
}) {
  return (
    <section
      aria-labelledby="dashboard-quick-links-heading"
      className="rounded-2xl border border-outline/10 bg-surface-container-low/40 p-4 sm:p-5"
    >
      <h2
        id="dashboard-quick-links-heading"
        className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant"
      >
        {title}
      </h2>
      <ul className="grid list-none gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex h-full flex-col rounded-xl border border-outline/10 bg-surface-container-lowest p-4 transition-colors hover:border-brand-500/30 hover:bg-brand-50/50 dark:hover:bg-brand-950/20"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-on-surface">{link.title}</span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-outline transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-2 text-xs leading-relaxed text-on-surface-variant">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
