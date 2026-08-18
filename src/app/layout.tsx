import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/providers'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { getPublicSiteUrl } from '@/lib/utils/seo'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  preload: false
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
  preload: false
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false
})

function siteMetadataBase(): URL {
  return new URL(getPublicSiteUrl())
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.seo.homeTitle,
    description: m.seo.homeDescription,
    metadataBase: siteMetadataBase(),
    openGraph: {
      title: m.common.brand,
      description: m.seo.homeDescription,
      images: ['/og-placeholder.svg'],
      locale,
      type: 'website',
    },
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getServerLocale()
  const messages = getMessages(locale)

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers serverLocale={locale} serverMessages={messages}>{children}</Providers>
      </body>
    </html>
  )
}

