'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Smartphone, KeyRound, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecoveryCodesPanel } from '@/components/admin/security/totp/recovery-codes-panel'
import { ProvisioningQrPreview } from '@/components/admin/security/totp/provisioning-qr-preview'
import { TotpVerificationInputs } from '@/components/admin/security/totp/totp-verification-inputs'
import { useAdminProfileMutations, useAdminProfileQuery } from '@/hooks/admin/useAdminProfile'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function AdminTotpClient() {
  const { messages, locale } = useI18n()
  const t = messages.admin.totpPage
  const router = useRouter()

  const profileQuery = useAdminProfileQuery()
  const { totpSetup, totpEnable, totpDisable } = useAdminProfileMutations()
  const profile = profileQuery.data

  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [enableCode, setEnableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [setupCompleteOpen, setSetupCompleteOpen] = useState(false)

  const setupStartedRef = useRef(false)

  const startSetup = (opts?: { allowRegen?: boolean }) => {
    if (!opts?.allowRegen && setupStartedRef.current) return
    setupStartedRef.current = true

    totpSetup.mutate(undefined, {
      onSuccess: (data) => {
        setSecret(data.secret_base32)
        setUri(data.provisioning_uri)
        setRecoveryCodes(data.recovery_codes)
        setEnableCode('')
      },
      onError: () => {
        setupStartedRef.current = false
      }
    })
  }

  const onEnable = (e: FormEvent) => {
    e.preventDefault()
    totpEnable.mutate(enableCode.trim(), {
      onSuccess: () => {
        setEnableCode('')
        setSetupCompleteOpen(true)
      }
    })
  }

  const onDisable = (e: FormEvent) => {
    e.preventDefault()
    totpDisable.mutate(disablePassword, {
      onSuccess: () => {
        setDisablePassword('')
        setSecret('')
        setUri('')
        setRecoveryCodes([])
        setSetupCompleteOpen(false)
        setupStartedRef.current = false
      }
    })
  }

  const totpEnabled = profile?.totp_enabled === true
  const busy = totpSetup.isPending || totpEnable.isPending || totpDisable.isPending

  useEffect(() => {
    if (profileQuery.isLoading) return
    if (totpEnabled) return
    if (secret || uri || recoveryCodes.length > 0) return
    startSetup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.isLoading, totpEnabled])

  const onCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
    } catch {
      // If clipboard is blocked, the user can still manually select/copy the text.
    }
  }

  const onReturnToDashboard = () => {
    setSetupCompleteOpen(false)
    router.push(withLocaleUrl('/admin/dashboard', locale))
  }

  const showSetupSteps = !totpEnabled || setupCompleteOpen

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
          <span>Security</span>
          <span className="text-xs">›</span>
          <span className="text-primary font-medium">Two-Factor Authentication</span>
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-on-surface mb-4">{t.title}</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">{t.subtitle}</p>
      </div>

      {profileQuery.isLoading && !profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" aria-hidden>
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 animate-pulse rounded-xl bg-surface-container-highest" />
            <div className="h-56 animate-pulse rounded-xl bg-surface-container-highest" />
            <div className="h-72 animate-pulse rounded-xl bg-surface-container-highest" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-72 animate-pulse rounded-xl bg-surface-container-highest" />
            <div className="h-64 animate-pulse rounded-xl bg-surface-container-highest" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {showSetupSteps && (
              <>
                <section className="bg-surface-container-lowest rounded-xl p-8 transition-shadow duration-300">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-heading">
                      1
                    </div>
                    <div className="flex-grow">
                      <h2 className="font-heading text-xl font-bold mb-2">Scan QR Code</h2>
                      <p className="text-on-surface-variant mb-8">
                        Open your preferred authenticator app (like Google Authenticator or 1Password) and scan this unique QR code.
                      </p>

                      {secret && uri ? (
                        <ProvisioningQrPreview secretBase32={secret} provisioningUri={uri} onCopySecret={onCopySecret} />
                      ) : (
                        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-highest p-6 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
                            <span className="text-sm font-medium text-on-surface-variant">Preparing setup…</span>
                          </div>
                          <Button type="button" onClick={() => startSetup({ allowRegen: true })} disabled={busy}>
                            {t.setup}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="bg-surface-container-lowest rounded-xl p-8 transition-shadow duration-300">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-heading">
                      2
                    </div>
                    <div className="flex-grow">
                      <h2 className="font-heading text-xl font-bold mb-2">Verify Setup</h2>
                      <p className="text-on-surface-variant mb-6">Enter the 6-digit verification code generated by your app to finalize the connection.</p>

                      <form onSubmit={onEnable}>
                        <TotpVerificationInputs value={enableCode} onChange={setEnableCode} disabled={busy || !secret} />

                        <Button
                          type="submit"
                          disabled={busy || enableCode.trim().length !== 6}
                          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-bold font-heading shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
                        >
                          Verify and Continue
                        </Button>
                      </form>
                    </div>
                  </div>
                </section>

                {recoveryCodes.length > 0 && (
                  <RecoveryCodesPanel
                    recoveryCodes={recoveryCodes}
                    busy={totpSetup.isPending}
                    onGenerateNew={() => startSetup({ allowRegen: true })}
                  />
                )}
              </>
            )}

            {totpEnabled && !setupCompleteOpen && (
              <section className={cn('rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-soft', busy && 'opacity-80')}>
                <h2 className="mb-4 text-lg font-bold text-on-surface">{t.disableSection}</h2>
                {busy && (
                  <div className="mb-4 flex justify-end" aria-hidden>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                <form onSubmit={onDisable} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {t.disablePassword}
                    </label>
                    <Input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="h-11"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="border-error/40 text-error hover:border-error/60 hover:bg-error-container/10" disabled={busy}>
                    {t.disable}
                  </Button>
                </form>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary mb-6 shadow-md">
                <ShieldCheck className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="font-heading text-lg font-bold mb-3">Why use 2FA?</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                Even if someone discovers your password, they won&apos;t be able to log in without the temporary code from your mobile device.
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2 text-primary">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Prevents unauthorized access
                </li>
                <li className="flex items-center gap-2 text-primary">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Protects sensitive marketplace data
                </li>
                <li className="flex items-center gap-2 text-primary">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  Required for Admin access
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <h3 className="font-heading text-lg font-bold mb-4">Recommended Apps</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-on-surface-variant" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Authy / Google Auth</p>
                    <p className="text-xs text-on-surface-variant">Universal & Reliable</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-on-surface-variant" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-bold">1Password / Bitwarden</p>
                    <p className="text-xs text-on-surface-variant">Integrated Password Managers</p>
                  </div>
                </div>
              </div>
            </div>

            {showSetupSteps && (
              <div className="bg-error-container/20 p-6 rounded-xl border border-error/10">
                <div className="flex items-center gap-2 text-error mb-2">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  <span className="font-bold text-sm">Caution</span>
                </div>
                <p className="text-xs text-on-error-container leading-relaxed">
                  Ensure you have saved your recovery codes before leaving this page. Account recovery without them may take up to 48 hours.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {setupCompleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-md" />
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-10 relative z-10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" aria-hidden />
            </div>
            <h2 className="font-heading text-2xl font-extrabold mb-3">Setup Complete</h2>
            <p className="text-on-surface-variant mb-8">
              Your account is now protected with two-factor authentication. Use your authenticator app next time you sign in.
            </p>
            <Button type="button" onClick={onReturnToDashboard} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold font-heading shadow-lg">
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
