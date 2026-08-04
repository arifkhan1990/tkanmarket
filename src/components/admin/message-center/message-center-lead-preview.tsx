'use client'

import { ArrowLeft, Copy, ExternalLink, Loader2, Mail, MapPin, MessageCircle, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageCenterQuickActions } from '@/components/admin/message-center/message-center-quick-actions'
import { useAdminLeadDetail } from '@/hooks/admin/useAdminLeadDetail'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

type PreviewCopy = {
  emptyTitle: string
  emptyHint: string
  loadingLead: string
  previewLoadError: string
  retryLoad: string
  contactSection: string
  inquirySection: string
  fabricSection: string
  lastNotes: string
  openFullLead: string
  copyEmail: string
  copiedToast: string
  backToThreads: string
  whatsappCta: string
}

function waHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}

export interface MessageCenterLeadPreviewProps {
  leadId: number | null
  locale: Locale
  copy: PreviewCopy
  onBackMobile: () => void
  showMobileBack: boolean
}

export function MessageCenterLeadPreview({ leadId, locale, copy, onBackMobile, showMobileBack }: MessageCenterLeadPreviewProps) {
  const query = useAdminLeadDetail(leadId ?? 0)
  const detail = query.data?.success ? query.data.data : undefined

  const onCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success(copy.copiedToast)
    } catch {
      toast.error(copy.previewLoadError)
    }
  }

  if (leadId == null) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="rounded-2xl border border-dashed border-outline/30 bg-surface-container-lowest/60 px-6 py-8">
          <p className="text-base font-semibold text-on-surface">{copy.emptyTitle}</p>
          <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{copy.emptyHint}</p>
        </div>
      </div>
    )
  }

  if ((query.isPending || query.isLoading) && !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-on-surface-variant">{copy.loadingLead}</p>
      </div>
    )
  }

  if (query.isError || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
        <p className="text-sm text-destructive">{copy.previewLoadError}</p>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => void query.refetch()}>
          {copy.retryLoad}
        </Button>
      </div>
    )
  }

  const { lead, fabric, notes } = detail
  const whatsapp = waHref(lead.phone)
  const lastNotes = notes.slice(0, 2)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showMobileBack ? (
        <div className="flex items-center gap-2 border-b border-outline/15 px-4 py-3 lg:hidden">
          <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={onBackMobile}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {copy.backToThreads}
          </Button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-on-surface font-heading">{lead.companyName}</h2>
              <p className="text-sm text-on-surface-variant">{lead.contactName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge intent="default" className="normal-case tracking-normal text-[10px]">
                  {lead.source.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl font-bold shadow-sm" asChild>
                <Link href={withLocaleUrl(`/admin/leads/${lead.id}`, locale)}>
                  {copy.openFullLead}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <MessageCenterQuickActions leadId={lead.id} status={lead.status} assignedToId={lead.assignedToId} />

          <Card className="border border-outline/15 bg-surface-container-lowest/80">
            <CardHeader className="pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{copy.contactSection}</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                <a href={`mailto:${lead.email}`} className="truncate font-medium text-primary hover:underline">
                  {lead.email}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2"
                  onClick={() => onCopyEmail(lead.email)}
                  aria-label={copy.copyEmail}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {lead.phone ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-on-surface">
                  <MessageCircle className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  <span>{lead.phone}</span>
                  {whatsapp ? (
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                        {copy.whatsappCta}
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {lead.city ? `${lead.city}, ` : ''}
                  {lead.country}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline/15 bg-surface-container-lowest/80">
            <CardHeader className="pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{copy.inquirySection}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{lead.inquiryText}</p>
            </CardContent>
          </Card>

          {fabric ? (
            <Card className="border border-outline/15 bg-surface-container-lowest/80">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{copy.fabricSection}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={withLocaleUrl(`/admin/fabrics/${fabric.id}`, locale)}
                  className="flex gap-4 rounded-2xl border border-outline/10 p-3 transition-colors hover:bg-surface-container-high/60"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-highest">
                    {fabric.imageUrl ? (
                      <Image src={fabric.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-on-surface-variant" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface line-clamp-2">{fabric.titleRu}</p>
                    <p className="text-xs text-on-surface-variant">{fabric.supplierName}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {lastNotes.length > 0 ? (
            <>
              <Separator className="bg-outline/15" />
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{copy.lastNotes}</p>
                <ul className="space-y-2">
                  {lastNotes.map((n) => (
                    <li key={n.id} className="rounded-xl border border-outline/10 bg-surface-container-high/40 p-3 text-sm text-on-surface">
                      <span className="text-xs text-on-surface-variant">
                        {new Date(n.createdAt).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US')}
                      </span>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap">{n.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
