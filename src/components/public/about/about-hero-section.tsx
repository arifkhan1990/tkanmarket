import type { Locale } from '@/types/i18n.types'
import Link from 'next/link'
import Image from 'next/image'

import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function AboutHeroSection({ locale }: { locale: Locale }) {
  return (
    <section className="relative overflow-hidden pt-10 pb-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="z-10">
          <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter md:text-7xl font-heading text-on-surface">
            The Digital Fabric <span className="text-primary">Ecosystem</span>
          </h1>

          <p className="mb-12 max-w-xl text-xl leading-relaxed text-on-surface-variant">
            TkanMarket is transforming how the global textile industry connects. From independent designers to
            massive manufacturing hubs, we provide the curated architecture for high-end material sourcing.
          </p>

          <div className="flex gap-4">
            <Link
              href={withLocaleUrl('/fabrics', locale)}
              className="rounded-2xl bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-lg font-bold text-on-primary shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Join the Marketplace
            </Link>
            <Link
              href={withLocaleUrl('/about#our-mission', locale)}
              className="rounded-2xl bg-surface-container-high px-8 py-4 text-lg font-bold text-on-surface"
            >
              Our Story
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdgYyj4w4GuatmmPCFXGsvqfH7H6mT8Yfc22Cj2eA1pESat_t0hmBr4kzsPgSLwFE3i9sZfHpN1pTr-GM4QySzGShf5GyYwC9qq28SjW-tkMfPh1ooBTZHQ2UBUR9ad5-UTOjtY6vMADX3WhBltjW0wBetmpCgutYjnWiXXedbs8Xl0vQsJe5q50WgSA3YCMhOab4wcHz-UjY9ZBsP003spOPqnSeRY-A6iDWXf0BdnscCX5QjtsVgIFWbvkQ9uDgNcAkGnuUH2rE"
              alt="Industrial Textile"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-8 -left-8 max-w-xs rounded-2xl border border-white/50 bg-surface-container-lowest p-8 shadow-xl backdrop-blur-md">
            <p className="font-sans italic text-on-surface-variant">
              &quot;We are the curator between global supply and local creativity.&quot;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

