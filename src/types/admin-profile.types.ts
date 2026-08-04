export interface AdminProfile {
  id: number
  email: string
  name: string
  avatar_url: string | null
  role: 'ADMIN' | 'SALES' | 'VIEWER'
  totp_enabled: boolean
}

export interface AdminTotpSetupPayload {
  secret_base32: string
  provisioning_uri: string
  recovery_codes: string[]
}
