import type { Locale } from '@/types/i18n.types'
import type { AboutTeamMember } from '@/types/about-page.types'
import Link from 'next/link'
import Image from 'next/image'

import { withLocaleUrl } from '@/lib/i18n/locale-path'

const teamMembers: AboutTeamMember[] = [
  {
    name: 'Elena Rostova',
    role: 'CEO & Founder',
    description: 'Ex-LVMH supply lead with 15 years in global textile sourcing.',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABRCUpyTHMnpcgn0telxT53dFsk0pK_ys6c90ls8NQNTa8F_dT8bcqCzZpK9PnAjo2bhTbV9S1X9SwBYD3HB__5gt3hNqUWBKEGWit7n1gVJWkHweamrZ3xI-WIbXAvaF8fPWFVMTVLUnCXdL49xSJaieOgZf80yLfvVa439QQnnpAUVqBhvb1xdRkGfB76ADqg9Ug64j5bFL6bnlTO7hK7SSI7gRtKGg46Ad5OXbwkjgssKAwT-vfg532OOaITjRB1sAOLV5N6o8',
    imageAlt: 'Elena Rostova',
  },
  {
    name: 'Marcus Chen',
    role: 'CTO',
    description: 'Specialist in B2B marketplace architecture and automated crawlers.',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDzVNg770nCkLyof72Ne40R-JiZUX-nYlZEvDds5vE8w0MkTODNCdXT6LfT2tCa7rjZckILIWuPQn_vaMR8cxR3JdwTYV3Je2oWBq7j5tuUWiTWbZLoA4B04hKTdNd-35LIzOdzGQFHuQFxFqFluUdr41FUPWEH3yayVGgU4sEeRO8sF3cYN7jdyF9DUwqGZCBGgxvDcgmEU9mfQvf5DeuYLC2xga8VZtbANdZ97a0FB19KVBhd6D56a8BrJEyL6SUzBHnD0rEMcpA',
    imageAlt: 'Marcus Chen',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Head of Logistics',
    description: 'Optimizing cross-border textile movement for over a decade.',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPPkZ8AMg7CelPX_NYelNlhRXtKsxHWROoEcC0wLxvY17hOWdDtmo9UOk0QFmFXmRJUT0yhuXSKcNBafC1_RQGrOAd66va7Cw0xSuW4impsyYNcWMi3VMCppmWKKzzjM-EHCf_PsM_C8yPGgliqBgmAvESRw3dae-LoZNWEKCzJkOmS1FgWY0uL25RSM83rwJEibewO-A4clpsj2KRQ7zY0Or5jvSTmsUNFJ7pwTpcVCY3xChTKFjpciBXjKsi9aAqm6rOoV5esG8',
    imageAlt: 'Sarah Jenkins',
  },
  {
    name: 'David Varga',
    role: 'Creative Director',
    description: 'Ensuring the TkanMarket aesthetic matches the quality of its contents.',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDXCey7kJnqxkwyzQ8jUu9_u8FInpE5bjQ110slg99SJ7gDJ9eXTL7eSg2g1hreDhvai1o_OeVNyGJsFs1gmPPoLTNTA9_15VrYCOvy9zbdrFMmGY0wudVOHVyMce1Wy1V9qjRJdZOjBldv_bPNVYH7XBhgNPBtes5pd250vm4hDP7QjqX4EPjn2wWJPhNZhRI5gU1ISdjVfLuX6YyJYHxFzgRgYPawqeyPvt5bFT_GZMAxivad1GP9hg7jGLfm3mH-hehZSfhAwLU',
    imageAlt: 'David Varga',
  },
]

export function AboutTeamSection({ locale }: { locale: Locale }) {
  return (
    <section className="py-32">
      <div className="flex flex-col items-end justify-between gap-8 pb-16 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight font-heading text-on-surface">
            The Curators Behind the Platform
          </h2>
          <p className="text-lg text-on-surface-variant font-sans">
            A multidisciplinary team of textile engineers, software architects, and supply chain experts.
          </p>
        </div>

        <Link
          href={withLocaleUrl('/contact', locale)}
          className="rounded-xl border-2 border-primary px-6 py-3 font-bold text-primary transition-all hover:bg-primary hover:text-white"
        >
          View All Positions
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((m) => (
          <div key={m.name} className="group">
            <div className="mb-6 aspect-[3/4] overflow-hidden rounded-2xl grayscale shadow-lg transition-all duration-500 group-hover:grayscale-0">
              <div className="relative h-full w-full">
                <Image src={m.imageSrc} alt={m.imageAlt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              </div>
            </div>

            <h4 className="mb-1 text-xl font-bold font-heading">{m.name}</h4>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">{m.role}</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">{m.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

