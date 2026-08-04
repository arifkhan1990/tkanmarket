'use client'

import { Download, Lock, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

type Props = {
  recoveryCodes: string[]
  busy?: boolean
  onGenerateNew: () => void
}

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function RecoveryCodesPanel({ recoveryCodes, busy, onGenerateNew }: Props) {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-8 transition-shadow duration-300">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-heading">
          3
        </div>
        <div className="flex-grow">
          <h2 className="font-heading text-xl font-bold mb-2">Save Recovery Codes</h2>
          <p className="text-on-surface-variant mb-6">
            If you lose your device, these codes will be the only way to regain access to your account. Store them in a secure place.
          </p>

          <div className="bg-on-surface text-surface-container-lowest rounded-xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lock className="h-24 w-24" aria-hidden />
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 font-mono tracking-wider text-sm md:text-base relative z-10">
              {recoveryCodes.map((c, idx) => (
                <div key={`${c}-${idx}`} className="flex items-center gap-3">
                  <span className="text-on-surface-variant/50 text-xs">{String(idx + 1).padStart(2, '0')}</span> {c}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                try {
                  downloadTxt('recovery-codes.txt', recoveryCodes.join('\n'))
                } catch (err) {
                  logger.error('totp.recovery_download_failed', { err })
                }
              }}
              disabled={busy}
              className="flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold font-heading hover:bg-surface-container-highest transition-all"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download TXT
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                try {
                  window.print()
                } catch (err) {
                  logger.error('totp.recovery_print_failed', { err })
                }
              }}
              disabled={busy}
              className="flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold font-heading hover:bg-surface-container-highest transition-all"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print Codes
            </Button>

            <Button
              type="button"
              onClick={onGenerateNew}
              disabled={busy}
              className="flex items-center gap-2 text-primary px-6 py-3 rounded-xl font-bold font-heading hover:bg-primary-fixed/30 transition-all"
            >
              Generate New
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

