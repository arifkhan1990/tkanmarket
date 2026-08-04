'use client'

import { useCallback } from 'react'

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function TotpVerificationInputs({ value, onChange, disabled }: Props) {
  const digits = value.padEnd(6, ' ').slice(0, 6)

  const setDigitAt = useCallback(
    (idx: number, digit: string) => {
      const d = digit.replace(/\D/g, '').slice(0, 1)
      const current = value.padEnd(6, '')
      const arr = current.split('')
      while (arr.length < 6) arr.push('')
      arr[idx] = d
      onChange(arr.join('').slice(0, 6).replace(/\s/g, ''))
    },
    [onChange, value]
  )

  return (
    <div className="flex gap-3 mb-8" aria-label="6-digit verification code">
      {Array.from({ length: 6 }).map((_, idx) => {
        const v = digits[idx] === ' ' ? '' : digits[idx]!
        return (
          <input
            key={idx}
            className="w-14 h-16 text-center text-2xl font-bold font-mono bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all disabled:opacity-60"
            inputMode="numeric"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={v}
            disabled={disabled}
            onChange={(e) => {
              setDigitAt(idx, e.target.value)
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text')
              const onlyDigits = text.replace(/\D/g, '').slice(0, 6)
              if (onlyDigits.length !== 6) return
              e.preventDefault()
              onChange(onlyDigits)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Backspace') return
              if (value[idx] && value[idx]!.length > 0) return
              const prev = document.querySelector<HTMLInputElement>(`input[data-idx="${idx - 1}"]`)
              prev?.focus()
            }}
            data-idx={idx}
          />
        )
      })}

      <div className="flex items-center text-on-surface-variant px-1 font-bold">—</div>
    </div>
  )
}

