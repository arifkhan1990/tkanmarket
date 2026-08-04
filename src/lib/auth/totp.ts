import { createHmac, randomBytes } from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/\s/g, '').toUpperCase()
  let bits = ''
  for (const ch of cleaned) {
    const val = BASE32_ALPHABET.indexOf(ch)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function base32Encode(buf: Buffer): string {
  let bits = ''
  for (let i = 0; i < buf.length; i++) {
    bits += buf[i]!.toString(2).padStart(8, '0')
  }
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  }
  return out
}

function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8)
  let c = counter
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(c & 0xffn)
    c >>= 8n
  }
  const hmac = createHmac('sha1', secret).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff)
  const mod = code % 1_000_000
  return String(mod).padStart(6, '0')
}

export function generateTotpSecretBase32(): string {
  const buf = randomBytes(20)
  return base32Encode(buf)
}

export function buildTotpProvisioningUri(params: { secretBase32: string; account: string; issuer: string }): string {
  const label = encodeURIComponent(`${params.issuer}:${params.account}`)
  const issuer = encodeURIComponent(params.issuer)
  const secret = params.secretBase32.replace(/\s/g, '')
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}

export function verifyTotp(secretBase32: string, sixDigitCode: string, window = 1): boolean {
  const trimmed = sixDigitCode.trim()
  if (!/^\d{6}$/.test(trimmed)) return false
  let secret: Buffer
  try {
    secret = base32Decode(secretBase32)
  } catch {
    return false
  }
  if (secret.length < 1) return false

  const t = BigInt(Math.floor(Date.now() / 1000 / 30))
  for (let w = -window; w <= window; w++) {
    const c = t + BigInt(w)
    if (hotp(secret, c) === trimmed) return true
  }
  return false
}
