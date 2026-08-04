import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { NotFoundSearch } from '@/components/marketplace/not-found-search'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.notFound.title,
    description: m.notFound.description,
  }
}

export default async function NotFoundPage() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-12 px-6 py-12 md:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Illustration */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-secondary-container/30 blur-3xl" />

          <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-soft">
            <div className="relative flex aspect-square items-center justify-center">
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <div className="h-full w-full bg-[radial-gradient(#1a40c2_1px,transparent_1px)] [background-size:20px_20px]" />
              </div>

              <div className="z-10 text-center">
                <div className="select-none font-heading text-[8rem] font-black leading-none text-primary/5 md:text-[10rem]">
                  404
                </div>
                <div className="-mt-12 md:-mt-16">
                  <div className="relative mx-auto h-48 w-48 md:h-64 md:w-64 drop-shadow-2xl">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSepaDLZNwXFE3Wtvu_4lJY8c0ygTxnz7jsXokYhNqh5-exAAZvuBQqBu_Mn-tWlXp75Po41s9F3RGb66McXVJcjWmBF9cEThMw9mJcPV4j-UGiG3N0K7SWq3_xdElVuIG4XWQKsdLH0pYZWHFiAi_za6-fyRuYOX9Nse4ZCrA1mLv1MHD9qj698yXbklNooNIimFpTK2dYxdtB7PtSQ4osKn3vklFWyZV7oM8043BwAOwVUYUf1lOFiXI253tsOLOHCtKUHCJS5g"
                      alt={m.notFound.illustrationAlt}
                      fill
                      sizes="(max-width: 768px) 60vw, 40vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 md:right-8 flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3 backdrop-blur-md shadow-xl">
              <div className="h-2 w-2 rounded-full bg-error" aria-hidden />
              <span className="font-mono text-xs text-on-surface-variant">{m.notFound.errorCodeBadge}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="order-1 space-y-8 lg:order-2">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl">
              {m.notFound.headlineBefore}
              <span className="text-primary">{m.notFound.headlineHighlight}</span>
              {m.notFound.headlineAfter}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-on-surface-variant">{m.notFound.body}</p>
          </div>

          <NotFoundSearch />

          <div className="pt-4 flex items-center gap-6">
            <Link
              href={withLocaleUrl('/contact', locale)}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {m.notFound.contactSupport}{' '}
              <span className="text-on-surface-variant/80" aria-hidden>
                →
              </span>
            </Link>
            <Link href="/sitemap.xml" className="text-sm font-medium text-on-surface-variant hover:text-on-surface">
              {m.notFound.sitemap}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

