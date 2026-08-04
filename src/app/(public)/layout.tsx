import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

function TopBanner() {
  const text = process.env.NEXT_PUBLIC_TOP_BANNER_TEXT?.trim()
  if (!text) return null
  return (
    <div className="bg-brand-50 text-brand-900 border-b border-outline/10">
      <div className="mx-auto max-w-screen-2xl px-6 py-2 text-xs font-bold uppercase tracking-widest md:px-8">
        {text}
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return <div className="h-[60px] border-b border-outline/10 bg-surface" aria-hidden />
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBanner />
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

