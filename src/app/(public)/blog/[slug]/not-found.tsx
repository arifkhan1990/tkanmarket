import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.blog.postNotFoundTitle} | ${m.common.brand}`,
    description: m.blog.postNotFoundDescription
  }
}

export default async function BlogPostNotFound() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <PublicPageShell blur="sm" className="pb-10 pt-6 md:pb-14 md:pt-8" contentClassName="space-y-8">
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="inline-flex items-center justify-center rounded-full border border-outline/10 bg-surface-container-lowest p-4">
          <FileQuestion className="h-10 w-10 text-primary" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
            {m.blog.postNotFoundTitle}
          </h1>
          <p className="text-base leading-relaxed text-on-surface-variant">{m.blog.postNotFoundDescription}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="h-12 rounded-2xl px-6 font-extrabold">
            <Link href={withLocaleUrl('/blog', locale)}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              {m.blog.backToInsights}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl px-6 font-extrabold">
            <Link href={withLocaleUrl('/', locale)}>{m.notFound.goHome}</Link>
          </Button>
        </div>
      </div>
    </PublicPageShell>
  )
}
