'use client'

import { useMemo } from 'react'
import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  secretBase32: string
  provisioningUri: string
  onCopySecret: () => void
}

function fnv1a32(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ProvisioningQrPreview({ secretBase32, provisioningUri, onCopySecret }: Props) {
  const pattern = useMemo(() => {
    // Deterministic "QR-like" pattern from the real provisioning URI.
    // (Not a standards-compliant scannable QR encoder; UI preview only.)
    const seed = fnv1a32(provisioningUri || secretBase32)
    const rnd = mulberry32(seed)
    const cols = 12
    const rows = 12
    const dots: boolean[] = []
    for (let i = 0; i < cols * rows; i++) {
      const v = rnd()
      // Bias towards a centered-ish denser region.
      const x = i % cols
      const y = Math.floor(i / cols)
      const dx = Math.abs(x - cols / 2)
      const dy = Math.abs(y - rows / 2)
      const bias = Math.max(0, 1 - (dx + dy) / (cols + rows))
      dots.push(v < 0.35 + bias * 0.25)
    }
    return { dots, cols, rows }
  }, [provisioningUri, secretBase32])

  return (
    <div className="flex flex-col gap-6 md:flex-row items-center bg-surface-container-low p-6 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-outline-variant/10">
        <div className="w-48 h-48 bg-white flex items-center justify-center relative">
          <div className="grid grid-cols-12 gap-1 w-full h-full opacity-90">
            {pattern.dots.map((on, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-sm',
                  on ? 'bg-primary' : 'bg-transparent'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow space-y-4">
        <div className="bg-surface-container-highest px-4 py-3 rounded-lg flex items-center justify-between group">
          <div>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Secret Key</p>
            <code className="font-mono text-sm tracking-widest text-primary font-bold">{secretBase32}</code>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-on-surface-variant hover:text-primary"
            onClick={onCopySecret}
            aria-label="Copy secret key"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="text-sm text-on-surface-variant italic">
          Can&apos;t scan the QR code? Enter the secret key manually into your app.
        </p>
      </div>
    </div>
  )
}

