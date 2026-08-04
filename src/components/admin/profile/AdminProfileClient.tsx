'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UseMutationResult } from '@tanstack/react-query'

import { useAdminProfileMutations, useAdminProfileQuery } from '@/hooks/admin/useAdminProfile'
import { NotificationProtocolCard } from '@/components/admin/profile/NotificationProtocolCard'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { AdminProfile } from '@/types/admin-profile.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-hidden>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container-highest" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-surface-container-highest" />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 rounded-2xl bg-surface-container-highest" />
              <div className="h-8 w-52 rounded bg-surface-container-highest" />
            </div>
            <div className="h-10 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-36 rounded-full bg-surface-container-highest" />
          </div>
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-48 rounded bg-surface-container-highest" />
            <div className="h-10 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-36 rounded-full bg-surface-container-highest" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-56 rounded bg-surface-container-highest" />
            <div className="h-12 w-full rounded bg-surface-container-highest" />
            <div className="h-12 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-36 rounded-full bg-surface-container-highest" />
          </div>
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-56 rounded bg-surface-container-highest" />
            <div className="h-10 w-full rounded bg-surface-container-highest" />
            <div className="h-10 w-full rounded bg-surface-container-highest" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileAccountForm({
  profile,
  messagesProfile: p,
  updateProfile
}: {
  profile: AdminProfile
  messagesProfile: {
    nameLabel: string
    avatarLabel: string
    save: string
  }
  updateProfile: UseMutationResult<AdminProfile, Error, { name?: string; avatar_url?: string | null }>
}) {
  const [name, setName] = useState(profile.name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const avatarSrc = avatarUrl.trim()
  const canRenderAvatar = avatarSrc.startsWith('http://') || avatarSrc.startsWith('https://')

  const onProfileSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({
      name: name.trim(),
      avatar_url: avatarUrl.trim() === '' ? null : avatarUrl.trim()
    })
  }

  return (
    <form
      onSubmit={onProfileSubmit}
      className={cn(
        'relative rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 shadow-soft',
        updateProfile.isPending && 'opacity-80'
      )}
    >
      {updateProfile.isPending && (
        <div className="absolute right-4 top-4" aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-3xl">
          {canRenderAvatar ? <AvatarImage src={avatarSrc} alt={profile.name} /> : null}
          <AvatarFallback>{(profile.name.trim()[0] ?? 'U').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-mono text-xs text-on-surface-variant">{profile.email}</p>
          <div className="mt-1 truncate text-sm font-semibold text-on-surface">{name || profile.name}</div>
        </div>
      </div>

      <div className="h-5" />
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{p.nameLabel}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{p.avatarLabel}</label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            type="url"
            placeholder="https://"
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={updateProfile.isPending}>
          {p.save}
        </Button>
      </div>
    </form>
  )
}

export function AdminProfileClient() {
  const { messages } = useI18n()
  const p = messages.admin.profilePage
  const query = useAdminProfileQuery()
  const { changePassword, updateProfile } = useAdminProfileMutations()
  const profile = query.data
  const security = messages.admin.securitySettingsPage

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const onPasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    changePassword.mutate({
      current_password: currentPassword,
      new_password: newPassword
    })
    setCurrentPassword('')
    setNewPassword('')
  }

  const profileFormKey = profile ? `${profile.id}:${profile.name}:${profile.avatar_url ?? ''}` : 'loading'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{p.subtitle}</p>
      </div>

      {query.isLoading && !profile ? (
        <ProfileSkeleton />
      ) : profile ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <ProfileAccountForm
              key={profileFormKey}
              profile={profile}
              messagesProfile={p}
              updateProfile={updateProfile}
            />

            <form
              onSubmit={onPasswordSubmit}
              className={cn(
                'relative rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 shadow-soft',
                changePassword.isPending && 'opacity-80'
              )}
            >
              <h2 className="mb-4 text-lg font-bold text-on-surface">{p.passwordSection}</h2>
              {changePassword.isPending && (
                <div className="absolute right-4 top-4" aria-hidden>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">
                    {p.currentPassword}
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">
                    {p.newPassword}
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={changePassword.isPending} className="rounded-full">
                  {p.changePassword}
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.activityFeed.title}</div>
                  <div className="mt-1 text-lg font-extrabold">{messages.admin.activityFeed.subtitle}</div>
                </div>
                <Button asChild variant="ghost" className="h-auto px-0 text-primary underline-offset-4">
                  <Link href="/admin/audit-log">{messages.admin.activityFeed.title}</Link>
                </Button>
              </div>
              <ActivityFeed />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <NotificationProtocolCard />

            <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{security.title}</div>
                <div className="mt-1 text-lg font-extrabold">{security.subtitle}</div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl bg-surface-container-highest p-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-on-surface">Two-factor authentication</div>
                  <div className="text-xs text-on-surface-variant">
                    {profile.totp_enabled ? 'Enabled for this account.' : 'Not enabled for this account.'}
                  </div>
                </div>
                <div
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-widest',
                    profile.totp_enabled ? 'bg-emerald-500/10 text-emerald-700' : 'bg-error-container text-on-error'
                  )}
                >
                  {profile.totp_enabled ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/admin/security/2fa">{security.linkTotp}</Link>
                </Button>
                <Button variant="outline" className="rounded-full">
                  <Link href="/admin/audit-log">{security.linkAuditLog}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
