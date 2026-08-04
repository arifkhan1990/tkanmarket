'use client'

import * as React from 'react'
import Image from 'next/image'
import { Calculator, Route, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShippingRateCalculatorMutation } from '@/hooks/admin/useShippingRateCalculatorMutation'
import { useI18n } from '@/hooks/useI18n'
import type { ShippingRateCalculateInput } from '@/lib/validations/shipping-rate-calculator.validation'
import type { ShippingCarrierQuote } from '@/types/shipping-rate-calculator.types'
import { cn } from '@/lib/utils'

const DHL_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ-dxXCmSAtbr6QYA4Lya6jBG7hmHUKXDOGjSK_2JSb9tVAQ1n4NUJ2yvhrGp9Z0c8CkuZPRWRszFC5GFzPTn0yggWjoZWblnkEezWhOtJLDt5B7z-W7iaIgb0vjbsQ0hYiS8ZOb1BPhgn5jhaZiO_swQ3IEklMsbeqxyGlJI-u886pVQLMhfumBid80TPnDUPSwl43R7F9G6-TrIGcituYqK6enEikWMiM5H38Jc0CKb69GZPSdvyTX2kBnqqgy2Mgw6C3mbatZw'
const FEDEX_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCvXKRIDttm855Lo5WRxbtcgKPfHUePLjtRXgS0jd7HPhxg-jT4eximNUdGzuNroQ0NEGFbAENUkkrBGTevjSTMgSxf7Ms0InD0q6LBAaHREi3xBeEz11V5LvWo2_ZOpfvQndR8I7BNJ9g_WRe17iq6RYWP6Sdj6Vq2nZghEYyjk80LRfBZc5kjGxJUTBeKxjFK8N8qRefyTvXh-vL292anX6NaWCKdL_Y42ChaOUWYOUMysSL4dvdzAk_eBevKl0yMQI0QTT6VCs4'
const MAERSK_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB2qqzIYikG4s0YD_WBFSj4Pg9HeNsjkVF9pXDQkI7tWhivSHdkrcQiIhSV3xolxHUrdYY0T1d5h6ziKNyBKLSWxaxkuVRRQoxCcJtXNF-H6156NWcTJ4LVUBm05l12n-N8L1P74dN3IZpMtpXG7X-kjAYbzDWBbA59tGQZZt0UEymXpPpiQnqRsAbkBAaQKtEZAFjzELJ3hdrA2yFB79oCLo2MUVyAzQEx9tHvxBu2NJsvZgXGW3QbvgMxfkYojCJquM2WN9r9HWI'

const LOGO_BY_CARRIER: Record<string, string> = {
  dhl_express: DHL_LOGO,
  fedex_priority: FEDEX_LOGO,
  maersk_ocean: MAERSK_LOGO
}

function CarrierLogo({ code }: { code: string }) {
  const src = LOGO_BY_CARRIER[code]
  if (!src) return null
  return (
    <Image
      src={src}
      alt=""
      width={72}
      height={16}
      className="h-4 w-auto object-contain"
      unoptimized
    />
  )
}

export function AdminShippingRateCalculator() {
  const { messages } = useI18n()
  const m = messages.admin.globalShippingPage
  const mutation = useShippingRateCalculatorMutation()

  const [gsm, setGsm] = React.useState('280')
  const [diameter, setDiameter] = React.useState('45')
  const [width, setWidth] = React.useState('150')
  const [lengthM, setLengthM] = React.useState('50')
  const [destination, setDestination] = React.useState<ShippingRateCalculateInput['destination']>('EU')
  const [fuel, setFuel] = React.useState(true)

  const run = () => {
    const body: ShippingRateCalculateInput = {
      gsm: Number(gsm),
      roll_diameter_cm: Number(diameter),
      roll_width_cm: Number(width),
      roll_length_m: Number(lengthM),
      destination,
      fuel_surcharge_enabled: fuel
    }
    void mutation.mutateAsync(body)
  }

  React.useEffect(() => {
    void mutation.mutateAsync({
      gsm: 280,
      roll_diameter_cm: 45,
      roll_width_cm: 150,
      roll_length_m: 50,
      destination: 'EU',
      fuel_surcharge_enabled: true
    })
    // Initial estimate only; further updates use “Recalculate”.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const data = mutation.data
  const best = data?.carriers.find((c) => c.is_best_value)

  const destLabel = (d: ShippingRateCalculateInput['destination']) => {
    if (d === 'EU') return m.destEU
    if (d === 'NA') return m.destNA
    if (d === 'SEA') return m.destSEA
    return m.destMENA
  }

  const shareEstimate = () => {
    if (!data) return
    const text = `${m.calculatorTitle}: ${best?.label ?? ''} ${best?.total_usd ?? ''} USD — ${data.route_label}`
    void navigator.clipboard.writeText(text).then(
      () => toast.success(m.calcCopied),
      () => toast.error(messages.admin.settingsMutation.updateFailed)
    )
  }

  return (
    <section className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="h-fit rounded-2xl bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(24,28,32,0.06)] lg:col-span-4">
        <div className="mb-8 flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="font-headline text-xl font-bold text-on-surface">{m.calculatorTitle}</h2>
        </div>
        <p className="mb-6 text-sm text-on-surface-variant">{m.calculatorSubtitle}</p>
        <div className="space-y-6">
          <div>
            <label htmlFor="gsm" className="text-sm font-semibold text-on-surface-variant">
              {m.calcGsm}
            </label>
            <div className="relative mt-2">
              <Input
                id="gsm"
                inputMode="decimal"
                value={gsm}
                onChange={(e) => setGsm(e.target.value)}
                className="rounded-xl bg-surface-container-highest pr-14"
              />
              <span className="absolute right-3 top-2.5 text-sm text-outline">g/m²</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="diam" className="text-sm font-semibold text-on-surface-variant">
                {m.calcRollDiameter}
              </label>
              <div className="relative mt-2">
                <Input
                  id="diam"
                  inputMode="decimal"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className="rounded-xl bg-surface-container-highest pr-12"
                />
                <span className="absolute right-3 top-2.5 text-sm text-outline">cm</span>
              </div>
            </div>
            <div>
              <label htmlFor="rw" className="text-sm font-semibold text-on-surface-variant">
                {m.calcRollWidth}
              </label>
              <div className="relative mt-2">
                <Input
                  id="rw"
                  inputMode="decimal"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="rounded-xl bg-surface-container-highest pr-12"
                />
                <span className="absolute right-3 top-2.5 text-sm text-outline">cm</span>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="len" className="text-sm font-semibold text-on-surface-variant">
              {m.calcRollLength}
            </label>
            <div className="relative mt-2">
              <Input
                id="len"
                inputMode="decimal"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value)}
                className="rounded-xl bg-surface-container-highest pr-12"
              />
              <span className="absolute right-3 top-2.5 text-sm text-outline">m</span>
            </div>
          </div>
          <div>
            <label htmlFor="dest" className="text-sm font-semibold text-on-surface-variant">
              {m.calcDestination}
            </label>
            <select
              id="dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value as ShippingRateCalculateInput['destination'])}
              className="mt-2 w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary"
            >
              <option value="EU">{destLabel('EU')}</option>
              <option value="NA">{destLabel('NA')}</option>
              <option value="SEA">{destLabel('SEA')}</option>
              <option value="MENA">{destLabel('MENA')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
            <span className="text-sm font-medium text-on-surface">{m.calcFuel}</span>
            <button
              type="button"
              role="switch"
              aria-checked={fuel}
              onClick={() => setFuel((v) => !v)}
              className={cn(
                'relative h-7 w-12 rounded-full transition-colors',
                fuel ? 'bg-primary' : 'bg-outline-variant/60'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  fuel ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>
          <Button
            type="button"
            className="w-full rounded-xl py-6 font-bold"
            disabled={mutation.isPending}
            onClick={() => run()}
          >
            {m.calcRecalculate}
          </Button>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(data?.carriers ?? []).map((c: ShippingCarrierQuote) => (
            <div
              key={c.code}
              className={cn(
                'rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm',
                c.is_best_value && 'ring-2 ring-primary'
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <span className="rounded-lg bg-primary-fixed px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary-fixed">
                  {c.mode_label}
                </span>
                <CarrierLogo code={c.code} />
              </div>
              <p className="font-mono text-2xl font-bold text-on-surface">${c.total_usd.toFixed(2)}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {m.calcDays.replace('{min}', String(c.eta_days_min)).replace('{max}', String(c.eta_days_max))}
                {c.is_best_value ? ` · ${m.calcBestValue}` : ''}
              </p>
            </div>
          ))}
        </div>

        {best && best.breakdown.length > 0 ? (
          <div className="overflow-hidden rounded-2xl bg-surface-container">
            <div className="flex flex-col gap-3 border-b border-surface-container-high bg-surface-container-high px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-headline text-lg font-bold text-on-surface">
                {m.calcRouteBreakdown}: {data?.route_label}
              </h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={shareEstimate}>
                  <Share2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-widest text-outline-variant">
                    <th className="px-6 py-4">{m.calcFeeComponent}</th>
                    <th className="px-6 py-4">{m.calcUnitRate}</th>
                    <th className="px-6 py-4">{m.calcQty}</th>
                    <th className="px-6 py-4">{m.calcCost}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {best.breakdown.map((row) => (
                    <tr key={row.label} className="bg-surface-container-lowest/40">
                      <td className="px-6 py-4 font-medium text-on-surface">{row.label}</td>
                      <td className="px-6 py-4 font-mono text-on-surface-variant">{row.unit_rate_label}</td>
                      <td className="px-6 py-4 font-mono text-on-surface-variant">{row.quantity_label}</td>
                      <td className="px-6 py-4 font-mono font-bold text-on-surface">${row.amount_usd.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-container-highest">
                    <td className="px-6 py-5 text-right font-headline text-lg font-extrabold text-on-surface" colSpan={3}>
                      {m.calcEstTotal}
                    </td>
                    <td className="px-6 py-5 font-mono text-2xl font-bold text-primary">${best.total_usd.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}

        <div className="relative h-56 overflow-hidden rounded-2xl bg-surface-container-high sm:h-64">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoG082sVjCy0USl61AyKLAsbtN9T9aSSmS2AbtQY1M-iEFezfiMlJgirTrnJgw6naEvghfDHhfX66EU8sN6W9IN8YDzSB0hA1wI0yw8FapXGbrnXGyYstj3UC2iCRHx34j7S2MNUAFr05tuZdztacVztkxFjMrwlnq6PeJpvEirD9w3cLXKZSUPWFS-kajXcirxHffYKfC_X8aL9GVC3FaUApjGOeYN-ZPW83HhaMskpc4HDi2ZINTtUjGPZLGl2jiwdh7rkwGy5A"
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 1024px) 100vw, 66vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-center gap-4 text-white">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
              <Route className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{m.calculatorTitle}</p>
              <p className="font-headline text-lg font-bold">{data?.route_label ?? '—'}</p>
              {data ? (
                <p className="text-xs opacity-90">
                  {m.calcGsm}: {gsm} · {m.calcRollLength}: {lengthM} m · {destLabel(destination)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
