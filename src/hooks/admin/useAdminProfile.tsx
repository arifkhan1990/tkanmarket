'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  getAdminProfileRequest,
  patchAdminProfileRequest,
  postAdminPasswordRequest,
  postTotpDisableRequest,
  postTotpEnableRequest,
  postTotpSetupRequest
} from '@/lib/http/admin-me-requests'
import { useI18n } from '@/hooks/useI18n'

const PROFILE_KEY = ['admin-profile'] as const

export function useAdminProfileQuery() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: getAdminProfileRequest
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.profile)
  }, [messages.admin.loadErrors.profile, query.error])

  return query
}

export function useAdminProfileMutations() {
  const qc = useQueryClient()
  const { messages } = useI18n()
  const p = messages.admin.profilePage
  const t = messages.admin.totpPage

  const updateProfile = useMutation({
    mutationFn: patchAdminProfileRequest,
    onSuccess: async (data) => {
      await qc.setQueryData(PROFILE_KEY, data)
      toast.success(p.savedToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const changePassword = useMutation({
    mutationFn: postAdminPasswordRequest,
    onSuccess: async () => {
      toast.success(p.passwordChangedToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const totpSetup = useMutation({
    mutationFn: () => postTotpSetupRequest(),
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const totpEnable = useMutation({
    mutationFn: postTotpEnableRequest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: PROFILE_KEY })
      toast.success(t.enabledToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const totpDisable = useMutation({
    mutationFn: postTotpDisableRequest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: PROFILE_KEY })
      toast.success(t.disabledToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  return {
    updateProfile,
    changePassword,
    totpSetup,
    totpEnable,
    totpDisable
  }
}
