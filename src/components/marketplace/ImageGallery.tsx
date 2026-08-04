'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FABRIC_IMAGE_PLACEHOLDER_PATH } from '@/constants/marketplace-images'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useImageLightboxZoom } from '@/hooks/use-image-lightbox-zoom'

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const { messages: m } = useI18n()
  const zoomLabel = m.product.webV.textureZoom
  const zoomHint = m.product.webV.lightboxZoomHint
  const safeImages = useMemo(() => (images.length > 0 ? images : []), [images])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [lensPct, setLensPct] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const lightbox = useImageLightboxZoom({ active: open, viewportRef })
  const { reset: lightboxReset, zoomInStep, zoomOutStep } = lightbox

  const current = safeImages[index] ?? FABRIC_IMAGE_PLACEHOLDER_PATH
  const hasRealImages = safeImages.length > 0
  const canNav = safeImages.length > 1

  const prev = useCallback(() => setIndex((v) => (v - 1 + safeImages.length) % safeImages.length), [safeImages.length])
  const next = useCallback(() => setIndex((v) => (v + 1) % safeImages.length), [safeImages.length])

  const thumbs = useMemo(() => safeImages.slice(0, 12), [safeImages])
  const lensX = lensPct?.x ?? 50
  const lensY = lensPct?.y ?? 50
  const [mediaFlags, setMediaFlags] = useState({ canHover: false, reduceMotion: false })

  useEffect(() => {
    const hover = window.matchMedia('(hover: hover)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () =>
      setMediaFlags({ canHover: hover.matches, reduceMotion: motion.matches })
    sync()
    hover.addEventListener('change', sync)
    motion.addEventListener('change', sync)
    return () => {
      hover.removeEventListener('change', sync)
      motion.removeEventListener('change', sync)
    }
  }, [])

  const heroHoverZoomActive =
    mediaFlags.canHover && !mediaFlags.reduceMotion && lensPct !== null && Boolean(current)
  const heroZoomScale = 1.88

  useEffect(() => {
    lightboxReset()
  }, [open, index, lightboxReset])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomInStep()
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomOutStep()
      }
      if (e.key === '0') {
        e.preventDefault()
        lightboxReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, zoomInStep, zoomOutStep, lightboxReset])

  const onHeroMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) {
      return
    }
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))
    setLensPct({ x, y })
  }, [])

  const onHeroLeave = useCallback(() => setLensPct(null), [])

  return (
    <div className="max-lg:space-y-4 space-y-6">
      <div
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-none bg-surface-container-lowest shadow-sm lg:rounded-lg"
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
      >
        {hasRealImages ? (
          <>
            <button
              type="button"
              className="absolute inset-0 cursor-zoom-in overflow-hidden text-left"
              onClick={() => setOpen(true)}
              aria-label={m.a11y.openImagePreview}
            >
              <div
                className={cn(
                  'absolute inset-0 origin-center will-change-transform',
                  heroHoverZoomActive
                    ? 'transition-[transform] duration-150 ease-out motion-reduce:transition-none'
                    : 'transition-transform duration-200 ease-out motion-reduce:transition-none'
                )}
                style={{
                  transform: heroHoverZoomActive ? `scale(${heroZoomScale})` : 'scale(1)',
                  transformOrigin: `${lensX}% ${lensY}%`
                }}
              >
                <Image
                  src={current}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                  priority
                  unoptimized={isRemoteImageSrc(current)}
                />
              </div>
            </button>
            <div
              className={cn(
                'pointer-events-none absolute bottom-6 right-6 hidden w-40 overflow-hidden rounded-lg border border-outline/20 bg-surface-container-lowest/85 p-2 shadow-2xl backdrop-blur-md transition-all duration-200 motion-reduce:transition-none sm:block [@media(hover:none)]:hidden',
                heroHoverZoomActive ? 'scale-95 opacity-0' : 'opacity-100 group-hover:scale-[1.02]'
              )}
              aria-hidden
            >
              <div className="relative h-full min-h-[7rem] w-full overflow-hidden rounded bg-surface-container-low lg:min-h-0">
                <Image
                  src={current}
                  alt=""
                  fill
                  sizes="192px"
                  className="object-cover"
                  style={{ objectPosition: `${lensX}% ${lensY}%`, transform: 'scale(2.65)' }}
                  unoptimized={isRemoteImageSrc(current)}
                />
                <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-tighter text-on-primary">
                  {zoomLabel}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0">
            <Image
              src={FABRIC_IMAGE_PLACEHOLDER_PATH}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover"
              priority
            />
          </div>
        )}
        {canNav ? (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-md lg:hidden">
            {safeImages.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={m.a11y.selectImageNumber.replace('{n}', String(i + 1))}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  i === index ? 'bg-white' : 'bg-white/45 hover:bg-white/70'
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIndex(i)
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {thumbs.length > 0 ? (
        <div className="hidden gap-4 pb-2 md:grid md:grid-cols-5 md:overflow-visible">
          {thumbs.map((src, i) => {
            const selected = i === index
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-surface-container-low md:w-auto',
                  selected ? 'ring-2 ring-primary' : 'hover:opacity-80'
                )}
                aria-label={m.a11y.selectImageNumber.replace('{n}', String(i + 1))}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={isRemoteImageSrc(src)}
                />
              </button>
            )
          })}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl overflow-hidden border border-white/10 bg-black/95 p-0 shadow-2xl"
          srOnlyTitle={title.trim() ? title : m.a11y.openImagePreview}
        >
          <div
            ref={viewportRef}
            className={cn(
              'relative h-[85vh] w-full touch-none outline-none',
              lightbox.scale > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            )}
            aria-label={title}
            tabIndex={-1}
            onWheel={lightbox.onWheel}
            onPointerDown={(e) => {
              if (lightbox.scale > 1) {
                setIsPanning(true)
              }
              lightbox.onPointerDown(e)
            }}
            onPointerMove={lightbox.onPointerMove}
            onPointerUp={(e) => {
              setIsPanning(false)
              lightbox.onPointerUp(e)
            }}
            onPointerCancel={(e) => {
              setIsPanning(false)
              lightbox.onPointerCancel(e)
            }}
            onDoubleClick={(e) => lightbox.toggleZoomAt(e.clientX, e.clientY, e.currentTarget)}
          >
            {current ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <div
                  className="relative h-full w-full will-change-transform"
                  style={{
                    transform: `translate3d(${lightbox.tx}px, ${lightbox.ty}px, 0) scale(${lightbox.scale})`,
                    transition: isPanning ? 'none' : 'transform 0.08s ease-out'
                  }}
                >
                  <Image
                    src={current}
                    alt={title}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    draggable={false}
                    unoptimized={isRemoteImageSrc(current)}
                  />
                </div>
              </div>
            ) : null}

            {canNav ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full text-white hover:bg-white/10"
                  onClick={prev}
                  aria-label={m.a11y.previousImage}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full text-white hover:bg-white/10"
                  onClick={next}
                  aria-label={m.a11y.nextImage}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Button>
              </>
            ) : null}

            <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-2 backdrop-blur-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-white hover:bg-white/15"
                  onClick={() => lightbox.reset()}
                  aria-label={m.a11y.resetZoom}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-white hover:bg-white/15"
                  onClick={() => lightbox.zoomOutStep()}
                  aria-label={m.a11y.zoomOut}
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <div className="min-w-14 shrink-0 text-center text-xs font-extrabold tabular-nums text-white">
                  {Math.round(lightbox.scale * 100)}%
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-white hover:bg-white/15"
                  onClick={() => lightbox.zoomInStep()}
                  aria-label={m.a11y.zoomIn}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <p className="hidden px-2 text-center text-[11px] font-medium leading-snug text-white/70 sm:block">{zoomHint}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
