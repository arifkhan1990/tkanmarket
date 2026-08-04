'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { isRemoteImageSrc } from '@/lib/utils'

import { useFabric } from '@/hooks/useFabric'
import { useRelatedFabrics } from '@/hooks/useRelatedFabrics'
import { FabricDetailSkeleton } from '@/hooks/useFabric'
import { RelatedFabricsSkeleton } from '@/hooks/useRelatedFabrics'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateLead } from '@/hooks/useCreateLead'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { EmptyState } from '@/components/common/EmptyState'
import { FabricGridClient } from '@/components/marketplace/FabricGridClient'
import { FabricDetailWishlistButton } from '@/components/marketplace/fabrics/FabricDetailWishlistButton'

import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle, getLocalizedFabricTags } from '@/lib/i18n/localized-fabric'
import { useI18n } from '@/hooks/useI18n'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'

type TabKey = 'description' | 'specs' | 'supplier'

export function FabricDetailClient({ slug }: { slug: string }) {
  const fabricQuery = useFabric(slug)
  const fabric = fabricQuery.data
  const relatedQuery = useRelatedFabrics(fabric?.id ?? 0)
  const related = relatedQuery.data ?? []

  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { messages } = useI18n()

  const createLead = useCreateLead({ suppressSuccessToast: true })

  const [tab, setTab] = useState<TabKey>('description')
  const [open, setOpen] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(() => messages.contactPage.placeholders.country)
  const [inquiryText, setInquiryText] = useState('')

  const breadcrumbItems = useMemo(() => {
    const title = fabric ? getLocalizedFabricTitle(fabric, locale) : null

    return [
      { label: messages.breadcrumbs.catalog, href: withLocaleUrl('/fabrics', locale) },
      { label: title ?? messages.common.ellipsis }
    ]
  }, [fabric, locale, messages.breadcrumbs.catalog, messages.common.ellipsis])

  const onSubmitLead = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fabric) return

    const input: CreateLeadInput = {
      source: 'MARKETPLACE_INQUIRY',
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: phone ? phone : undefined,
      country,
      city: undefined,
      fabric_id: fabric.id,
      inquiry_text: inquiryText,
      utm_source: undefined,
      utm_campaign: undefined
    }

    createLead.mutate(input, {
      onSuccess: () => {
        setOpen(false)
        router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
      }
    })
  }

  return (
    <div className="px-6 md:px-8 py-10 space-y-10">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        {fabricQuery.isLoading ? (
          <FabricDetailSkeleton />
        ) : !fabric ? (
          <div className="max-w-2xl">
            <p className="text-lg font-extrabold text-on-surface">{messages.fabricDetailClient.notFound}</p>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12">
            <section className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-4 overflow-hidden">
                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-surface-container-low/30">
                  {fabric.images?.[0] ? (
                    <Image
                      src={fabric.images[0]}
                      alt={getLocalizedFabricTitle(fabric, locale)}
                      width={1200}
                      height={900}
                      className="object-cover w-full h-full"
                      unoptimized={isRemoteImageSrc(fabric.images[0])}
                      priority
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface-container-low to-surface-container-highest" />
                  )}
                </div>
                {fabric.images && fabric.images.length > 1 ? (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {fabric.images.slice(0, 4).map((img) => (
                      <div key={img} className="aspect-square rounded-2xl overflow-hidden bg-surface-container-low/40">
                        <Image
                          src={img}
                          alt={messages.fabricDetailClient.thumbnailAlt.replace('{title}', getLocalizedFabricTitle(fabric, locale))}
                          width={320}
                          height={320}
                          className="object-cover w-full h-full"
                          unoptimized={isRemoteImageSrc(img)}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.product.specs.sku}</div>
                    <div className="font-mono text-sm font-bold text-on-surface">{fabric.sku ?? '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.views}</div>
                    <div className="font-mono text-sm font-bold text-on-surface">{fabric.viewsCount ?? 0}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getLocalizedFabricTags(fabric, locale).slice(0, 8).map((t, i) => (
                    <Link
                      key={`${t}-${i}`}
                      href={withLocaleUrl(`/fabrics?material=${encodeURIComponent(fabric.tags[i] ?? t)}`, locale)}
                      className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <aside className="lg:col-span-5 xl:col-span-4">
              <div className="lg:sticky top-28 rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-5">
                <div className="space-y-2">
                  <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">
                    {getLocalizedFabricTitle(fabric, locale)}
                  </h1>
                  <div className="text-sm font-bold text-on-surface-variant">
                    {fabric.fabricType ?? messages.fabrics.filters.types.other}
                    {fabric.gsm ? ` · ${fabric.gsm} GSM` : null}
                    {fabric.widthCm ? ` · ${fabric.widthCm} cm` : null}
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.product.specs.price}</div>
                    <div className="mt-1 font-mono text-3xl font-extrabold text-on-surface">
                      {fabric.priceUsd ? `$${fabric.priceUsd}` : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.product.specs.moq}</div>
                    <div className="mt-1 font-mono text-xl font-extrabold text-on-surface">{fabric.moq ?? '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-3xl bg-surface-container-lowest border border-outline/10 overflow-hidden flex items-center justify-center">
                      <span className="font-extrabold text-primary">S</span>
                    </div>
                    <div className="space-y-0">
                      <div className="text-sm font-bold text-on-surface">{fabric.supplierName}</div>
                      <div className="text-xs text-on-surface-variant">{messages.fabricDetailClient.verifiedSupplier}</div>
                    </div>
                  </div>
                  <Link
                    href={withLocaleUrl(`/suppliers/${fabric.supplier.slug}`, locale)}
                    className="text-sm font-extrabold text-primary hover:opacity-90 transition-opacity"
                  >
                    {messages.fabricDetailClient.supplierProfileShort}
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full rounded-3xl" onClick={() => setOpen(true)}>
                    {messages.fabricDetailClient.requestPrice}
                  </Button>
                  <div className="flex flex-wrap gap-3">
                    <FabricDetailWishlistButton fabricId={fabric.id} />
                    <Button
                      variant="outline"
                      className="min-w-[140px] flex-1 rounded-3xl"
                      onClick={() => router.push(withLocaleUrl('/contact', locale))}
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl bg-surface-container-high px-4 py-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.quickSpecs}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">GSM</div>
                      <div className="font-mono font-bold">{fabric.gsm ?? '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{messages.product.specs.width}</div>
                      <div className="font-mono font-bold">{fabric.widthCm ? `${fabric.widthCm} cm` : '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">MOq</div>
                      <div className="font-mono font-bold">{fabric.moq ?? '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{messages.product.specs.type}</div>
                      <div className="font-mono font-bold">{fabric.fabricType ?? '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Color</div>
                      <div className="font-mono font-bold">{fabric.color ?? '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Supply</div>
                      <div className="font-mono font-bold">{fabric.supplyType ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-12 space-y-6">
              <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-4">
                <div className="flex flex-wrap gap-2 px-2">
                  {(
                    [
                      ['description', messages.fabricDetailClient.tabs.description],
                      ['specs', messages.fabricDetailClient.tabs.specs],
                      ['supplier', messages.fabricDetailClient.tabs.supplier]
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={
                        tab === key
                          ? 'rounded-2xl bg-surface-container-highest px-4 py-3 text-sm font-extrabold text-primary'
                          : 'rounded-2xl px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-lowest transition-colors'
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'description' ? (
                <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
                  <div className="text-sm font-bold text-outline/80 uppercase tracking-widest">{messages.fabricDetailClient.descriptionLabel}</div>
                  <p className="text-body-lg text-on-surface-variant leading-relaxed">
                    {locale === 'en'
                      ? (fabric.descriptionEn?.trim() ? fabric.descriptionEn : fabric.descriptionRu)
                      : fabric.descriptionRu}
                  </p>
                </div>
              ) : null}

              {tab === 'specs' ? (
                <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.compositionLabel}</div>
                      <div className="text-body-lg text-on-surface-variant">
                        {fabric.composition && fabric.composition.length > 0
                          ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
                          : '—'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.gsmWidthLabel}</div>
                      <div className="text-body-lg text-on-surface-variant">
                        {fabric.gsm ? `${fabric.gsm} GSM` : '—'}
                        {fabric.widthCm ? ` · ${fabric.widthCm} cm` : ''}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.product.specs.moq}</div>
                      <div className="text-body-lg text-on-surface-variant">{fabric.moq ?? '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.fabricTypeLabel}</div>
                      <div className="text-body-lg text-on-surface-variant">{fabric.fabricType ?? '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">Color</div>
                      <div className="text-body-lg text-on-surface-variant">{fabric.color ?? '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">Supply Type</div>
                      <div className="text-body-lg text-on-surface-variant">{fabric.supplyType ?? '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">Shipment Time</div>
                      <div className="text-body-lg text-on-surface-variant">{fabric.shipmentTime ?? '—'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">Usage</div>
                      <div className="text-body-lg text-on-surface-variant">
                        {locale === 'en'
                          ? (fabric.usageEn?.trim() ? fabric.usageEn : fabric.usageRu)
                          : (fabric.usageRu?.trim() ? fabric.usageRu : fabric.usageEn)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === 'supplier' ? (
                <div className="rounded-[3rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.tabs.supplier}</div>
                      <div className="text-lg font-extrabold">{fabric.supplier.name}</div>
                    </div>
                    <Link
                      href={withLocaleUrl(`/suppliers/${fabric.supplier.slug}`, locale)}
                      className="text-sm font-extrabold text-primary hover:opacity-90 transition-opacity"
                    >
                      {messages.fabricDetailClient.goToProfile}
                    </Link>
                  </div>
                  <div className="text-sm text-on-surface-variant leading-relaxed">{fabric.supplierName}</div>
                </div>
              ) : null}
            </section>

            <section className="lg:col-span-12 space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h2 className="font-heading text-heading-xl font-extrabold tracking-tight">{messages.fabricDetailClient.relatedTitle}</h2>
                  <div className="text-sm text-on-surface-variant">{messages.fabricDetailClient.relatedSubtitle}</div>
                </div>
              </div>

              {relatedQuery.isLoading ? (
                <RelatedFabricsSkeleton />
              ) : related.length > 0 ? (
                <FabricGridClient
                  items={related}
                  showWishlist
                  gridClassName="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                />
              ) : (
                <EmptyState title={messages.fabricDetailClient.noRelatedTitle} description={messages.fabricDetailClient.noRelatedDescription} />
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{messages.fabricDetailClient.dialogTitle}</DialogTitle>
            <DialogDescription>{messages.fabricDetailClient.dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitLead} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.company}</div>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={messages.fabricDetailClient.form.placeholders.company}
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.contact}</div>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={messages.fabricDetailClient.form.placeholders.contact}
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.email}</div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={messages.fabricDetailClient.form.placeholders.email}
                  inputMode="email"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.phoneOptional}</div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={messages.fabricDetailClient.form.placeholders.phone}
                  inputMode="tel"
                />
              </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.country}</div>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={messages.fabricDetailClient.form.placeholders.country}
                  />
                </div>
              <div className="space-y-2 md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{messages.fabricDetailClient.form.message}</div>
                <Textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder={messages.fabricDetailClient.form.messagePlaceholder}
                />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={createLead.isPending}>
              {messages.fabricDetailClient.form.submit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

