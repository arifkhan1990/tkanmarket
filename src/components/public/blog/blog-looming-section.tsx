import Image from 'next/image'

import { BLOG_LOOM_IMAGES } from '@/constants/blog.constants'

type Props = {
  badge: string
  title: string
  body: string
  expertsHint: string
}

export function BlogLoomingSection({ badge, title, body, expertsHint }: Props) {
  const [g0, g1, g2, g3] = BLOG_LOOM_IMAGES.grid

  return (
    <section className="w-full">
      <div className="relative flex flex-col items-center gap-10 overflow-hidden rounded-[2.5rem] bg-surface-container-low p-8 md:flex-row md:gap-12 md:p-12 lg:gap-16 lg:p-16 xl:p-24">
        <div className="z-10 flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary md:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {badge}
          </div>
          <h2 className="mb-6 font-heading text-4xl font-black leading-none tracking-tight text-on-surface md:mb-8 md:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mb-8 max-w-lg font-sans text-lg leading-relaxed text-on-surface-variant md:mb-10 md:text-xl">
            {body}
          </p>
          <div className="flex items-center gap-0">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary-fixed">
              <Image src={BLOG_LOOM_IMAGES.portraitA} alt="" fill className="object-cover" sizes="48px" />
            </div>
            <div className="relative -ml-6 h-12 w-12 overflow-hidden rounded-full border-2 border-primary-fixed bg-surface-container-lowest">
              <Image src={BLOG_LOOM_IMAGES.portraitB} alt="" fill className="object-cover" sizes="48px" />
            </div>
            <div className="ml-3 text-sm font-bold italic text-on-surface/50">{expertsHint}</div>
          </div>
        </div>
        <div className="relative w-full flex-1 md:w-auto">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-3 pt-6 md:space-y-4 md:pt-12">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-container-highest shadow-soft">
                <Image
                  src={g0}
                  alt=""
                  fill
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  sizes="(max-width: 768px) 45vw, 320px"
                />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container-highest shadow-soft">
                <Image
                  src={g1}
                  alt=""
                  fill
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  sizes="(max-width: 768px) 45vw, 320px"
                />
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container-highest shadow-soft">
                <Image
                  src={g2}
                  alt=""
                  fill
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  sizes="(max-width: 768px) 45vw, 320px"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-container-highest shadow-soft">
                <Image
                  src={g3}
                  alt=""
                  fill
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  sizes="(max-width: 768px) 45vw, 320px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
