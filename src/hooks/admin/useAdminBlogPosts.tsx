'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiResponse } from '@/lib/utils/api-response'
import type { BlogPostDetail, BlogPostSummary } from '@/types/blog.types'

export type BlogListResult = {
  items: BlogPostSummary[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export function useAdminBlogPosts(params: { page: number; limit: number; q?: string; category?: string }) {
  return useQuery<ApiResponse<BlogPostSummary[]> & { meta: BlogListResult['meta'] }>({
    queryKey: ['admin-blog-posts', params],
    queryFn: async ({ signal }) => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q) sp.set('q', params.q)
      if (params.category) sp.set('category', params.category)

      const res = await fetch(`/api/v1/admin/blog?${sp.toString()}`, { signal })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to load blog posts')
      return json
    }
  })
}

export function useCreateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/v1/admin/blog', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to create blog post')
      return json.data as BlogPostDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      toast.success('Blog post created')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create blog post')
    }
  })
}

export function useUpdateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/v1/admin/blog/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to update blog post')
      return json.data as BlogPostDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      toast.success('Blog post updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update blog post')
    }
  })
}

export function useDeleteBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/v1/admin/blog/${encodeURIComponent(slug)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to delete blog post')
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      toast.success('Blog post deleted')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete blog post')
    }
  })
}

export function useGenerateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { fabricId: number; category?: string | null; authorName?: string | null; authorRole?: string | null }) => {
      const res = await fetch('/api/v1/admin/blog/ai-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to generate blog post')
      return json.data as BlogPostDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      toast.success('AI blog post generated and saved')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to generate blog post')
    }
  })
}

export function useRegenerateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/v1/admin/blog/${encodeURIComponent(slug)}/regenerate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to regenerate blog post')
      return json.data as BlogPostDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      toast.success('Blog post successfully regenerated via AI')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate blog post')
    }
  })
}
