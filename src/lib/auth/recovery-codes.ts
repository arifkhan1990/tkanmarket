import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // avoid O/I
const RECOVERY_DIGITS = '0123456789'

export function formatRecoveryCode(parts?: { lettersPerPart: number; digitsPerPart: number; partsCount: number }): string {
  const cfg = parts ?? { lettersPerPart: 2, digitsPerPart: 2, partsCount: 3 }
  const segments: string[] = []
  for (let i = 0; i < cfg.partsCount; i++) {
    const letters = randomStringFromAlphabet(RECOVERY_ALPHABET, cfg.lettersPerPart)
    const digits = randomStringFromAlphabet(RECOVERY_DIGITS, cfg.digitsPerPart)
    segments.push(`${letters}${digits}`)
  }
  return segments.join('-')
}

export function generateRecoveryCodes(count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(formatRecoveryCode())
  }
  return out
}

export function normalizeRecoveryCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidRecoveryCode(input: string): boolean {
  // Example: AB12-CD34-EF56
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizeRecoveryCode(input))
}

function getRecoveryPepper(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ''
}

export function hashRecoveryCode(code: string): string {
  const pepper = getRecoveryPepper()
  if (!pepper) throw new Error('Recovery code pepper is not configured')
  const normalized = normalizeRecoveryCode(code)
  return createHmac('sha256', pepper).update(normalized).digest('hex')
}

// Helps with constant-time comparisons when comparing two hashes.
export function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function randomStringFromAlphabet(alphabet: string, length: number): string {
  if (length <= 0) return ''
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    const b = bytes[i] ?? 0
    out += alphabet[b % alphabet.length] ?? ''
  }
  return out
}

