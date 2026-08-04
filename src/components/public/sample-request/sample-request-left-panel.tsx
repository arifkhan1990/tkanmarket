import Image from 'next/image'
import { Headphones, Leaf, ShieldCheck, Truck } from 'lucide-react'

import type { Messages } from '@/lib/i18n/get-messages'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1620799140408-ed53429a4952?auto=format&fit=crop&w=1200&q=80'

type Props = {
  messages: Messages['leads']['sampleDedicated']
}

export function SampleRequestLeftPanel({ messages }: Props) {
  return (
    <div className="space-y-10 lg:space-y-12">
      <div className="space-y-4 md:space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-primary-fixed">
          {messages.badge}
        </span>
        <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl md:text-5xl">
          {messages.headline}
        </h1>
        <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">{messages.subhead}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { icon: Truck, title: messages.trust1Title, body: messages.trust1Body },
          { icon: ShieldCheck, title: messages.trust2Title, body: messages.trust2Body },
          { icon: Leaf, title: messages.trust3Title, body: messages.trust3Body },
          { icon: Headphones, title: messages.trust4Title, body: messages.trust4Body }
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 transition-colors hover:bg-surface-container-high md:p-6"
          >
            <Icon className="mb-3 h-8 w-8 text-primary" aria-hidden />
            <h3 className="mb-2 font-bold text-on-surface">{title}</h3>
            <p className="text-sm text-on-surface-variant">{body}</p>
          </div>
        ))}
      </div>

      <div className="relative h-56 overflow-hidden rounded-2xl shadow-2xl shadow-black/10 md:h-64 dark:shadow-none">
        <Image
          src={HERO_IMAGE}
          alt={messages.heroImageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-on-surface/85 to-transparent p-6 md:p-8">
          <div>
            <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-tighter text-white/75">
              {messages.heroCaptionSku}
            </p>
            <p className="font-heading text-lg font-bold text-white">{messages.heroCaptionTitle}</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-80">
        {messages.trustedBy}
      </p>
    </div>
  )
}
