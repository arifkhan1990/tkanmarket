'use client'

import { CheckCircle2, ShieldCheck, Timer } from 'lucide-react'

export function BulkInquiryPortalLeftEditorial(props: {
  isLoading: boolean
  qualityRatePercent: number | null
  avgLeadTimeDays: number | null
  inquiriesThisMonth: number
}) {
  return (
    <section className="lg:w-[45%] bg-surface-container-low px-8 lg:px-16 py-14 lg:py-20">
      <div className="max-w-md mx-auto lg:mx-0 lg:sticky lg:top-24">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
          Enterprise Sourcing
        </span>

        <h1 className="font-headline text-4xl font-extrabold text-on-surface leading-[1.1] mb-8">
          Scale Your Production with <span className="text-primary">Confidence</span>.
        </h1>

        <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
          Join buyers worldwide using TkanMarket to streamline sourcing and negotiate faster with verified suppliers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm">
            <CheckCircle2 className="text-primary mb-3" aria-hidden />
            <div className="font-mono text-primary mb-1">
              {props.isLoading ? '—' : props.qualityRatePercent != null ? `${props.qualityRatePercent}%` : 'N/A'}
            </div>
            <div className="text-sm font-semibold">Quality Rate</div>
          </div>
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm">
            <Timer className="text-tertiary mb-3" aria-hidden />
            <div className="font-mono text-tertiary mb-1">
              {props.isLoading ? '—' : props.avgLeadTimeDays != null ? `${Math.round(props.avgLeadTimeDays)} Days` : 'N/A'}
            </div>
            <div className="text-sm font-semibold">Avg. Lead Time</div>
          </div>
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm md:col-span-2 flex items-center gap-4">
            <ShieldCheck className="text-primary" aria-hidden />
            <div>
              <div className="font-mono text-primary mb-1">
                {props.isLoading ? '—' : `${props.inquiriesThisMonth}+`}
              </div>
              <div className="text-sm font-semibold">Inquiries this month</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 bg-primary-container/20 rounded-xl flex items-center justify-center">
              <span aria-hidden className="text-primary font-bold">
                ✓
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Direct Factory Access</h3>
              <p className="text-sm text-on-surface-variant">Bypass middlemen and negotiate directly with verified suppliers.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 bg-primary-container/20 rounded-xl flex items-center justify-center">
              <span aria-hidden className="text-primary font-bold">
                ⛭
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Secure Transactions</h3>
              <p className="text-sm text-on-surface-variant">Every inquiry is protected by our Trade Protection protocol.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

