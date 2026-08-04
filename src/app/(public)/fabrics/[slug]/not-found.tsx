import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SearchX, ArrowLeft, Boxes } from 'lucide-react'

import { HomeSearchBar } from '@/components/marketplace/HomeSearchBar'
import { Button } from '@/components/ui/button'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.fabrics.detailNotFoundTitle,
    description: m.fabrics.detailNotFoundDescription,
  }
}

export default async function FabricNotFoundPage() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <PublicPageShell className="py-10 md:py-14" blur="sm" contentClassName="space-y-10">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline/10 bg-surface-container-lowest px-4 py-2">
            <SearchX className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">404</span>
          </div>
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              {m.fabrics.detailNotFoundTitle}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-on-surface-variant">
              {m.fabrics.detailNotFoundDescription}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-2xl px-6 text-base font-extrabold">
              <Link href={withLocaleUrl('/fabrics', locale)}>
                <Boxes className="mr-2 h-5 w-5" aria-hidden />
                {m.fabrics.viewSimilar}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl px-6 text-base font-extrabold">
              <Link href={withLocaleUrl('/', locale)}>
                <ArrowLeft className="mr-2 h-5 w-5" aria-hidden />
                {m.notFound.goHome}
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 shadow-soft">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.search.action}</div>
            <div className="mt-4">
              <HomeSearchBar />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-secondary-container/30 blur-3xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-outline/10 bg-surface-container-lowest shadow-soft">
            <div className="aspect-[4/3] w-full">
              <Image
                src="/og-placeholder.svg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/90 via-transparent to-transparent dark:from-background/80" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-background/80 p-5 backdrop-blur-md">
              <div className="text-sm font-extrabold text-on-surface">{m.notFound.description}</div>
              <div className="mt-1 text-xs text-on-surface-variant">{m.notFound.body}</div>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}

