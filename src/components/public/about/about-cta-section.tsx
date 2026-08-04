import type { Locale } from '@/types/i18n.types'
import Link from 'next/link'
import Image from 'next/image'

import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function AboutCtaSection({ locale }: { locale: Locale }) {
  return (
    <section className="mb-24">
      <div className="relative mx-auto max-w-screen-2xl overflow-hidden rounded-[2.5rem] bg-primary p-16 text-center md:p-24">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlK_vdvaUHf5R0DrzcYrTj5J6L7iDRZ1ZqEsaJFNHBjY7n5ml40x18-m7R0Frr4ctuPJLNiN6dyU0M8-G1bxqxho1n1HzVWuwY01SiIhOx_AoKrv7PKht9LKZJ2DU_xBc0u71ZSgAutofvglaBFD65Jwg4TofMyvkKjpFAQvCeVhtpKrdmmFoiEfG2frmANac8kGpHkGZR5l8ByQoi_MbfKkKjMJa33e-hDw1Nq2Wdci0H-XCrcAKrhRAgONggLkg-Upp230nkzvU"
            alt="Background pattern"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="mb-8 text-4xl font-extrabold tracking-tight md:text-5xl font-heading text-white">
            Ready to curate your next collection?
          </h2>
          <p className="mb-12 text-xl text-primary-fixed font-sans">
            Join the thousands of professionals sourcing better, faster, and smarter with TkanMarket.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={withLocaleUrl('/contact', locale)}
              className="rounded-2xl bg-white px-10 py-5 text-lg font-bold text-primary shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Create Free Account
            </Link>
            <Link
              href={withLocaleUrl('/contact', locale)}
              className="rounded-2xl border border-white/20 bg-primary-container px-10 py-5 text-lg font-bold text-white"
            >
              Speak to a Specialist
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

