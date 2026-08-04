'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, FileText, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import { useAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, useGenerateBlogPost, useRegenerateBlogPost } from '@/hooks/admin/useAdminBlogPosts'

import type { BlogPostSummary } from '@/types/blog.types'

const LIMIT = 15

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

type BlogFormData = {
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  readMinutes: string
  authorName: string
  authorRole: string
  heroImageUrl: string
}

const emptyForm: BlogFormData = {
  slug: '', title: '', excerpt: '', body: '', category: '',
  readMinutes: '', authorName: '', authorRole: '', heroImageUrl: '',
}

type Mode = { type: 'create' } | { type: 'edit'; slug: string }

export function AdminBlogClient() {
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(id)
  }, [search])

  const { data, isLoading } = useAdminBlogPosts({ page, limit: LIMIT, q: debouncedSearch })

  const posts = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<Mode>({ type: 'create' })
  const [form, setForm] = React.useState<BlogFormData>(emptyForm)

  const [aiDialogOpen, setAiDialogOpen] = React.useState(false)
  const [fabricId, setFabricId] = React.useState('')
  const [aiAuthorName, setAiAuthorName] = React.useState('')
  const [aiCategory, setAiCategory] = React.useState('')

  const createPost = useCreateBlogPost()
  const updatePost = useUpdateBlogPost()
  const deletePost = useDeleteBlogPost()
  const generatePost = useGenerateBlogPost()
  const regeneratePost = useRegenerateBlogPost()

  function openCreate() {
    setForm(emptyForm)
    setDialogMode({ type: 'create' })
    setDialogOpen(true)
  }

  function openEdit(post: BlogPostSummary) {
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? '',
      body: '',
      category: post.category ?? '',
      readMinutes: post.readMinutes?.toString() ?? '',
      authorName: post.authorName ?? '',
      authorRole: '',
      heroImageUrl: post.heroImageUrl ?? '',
    })
    setDialogMode({ type: 'edit', slug: post.slug })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt || null,
      body: form.body,
      category: form.category || null,
      readMinutes: form.readMinutes ? parseInt(form.readMinutes, 10) : null,
      authorName: form.authorName || null,
      authorRole: form.authorRole || null,
      heroImageUrl: form.heroImageUrl || null,
    }

    if (dialogMode.type === 'create') {
      await createPost.mutateAsync(payload)
    } else {
      await updatePost.mutateAsync({ slug: dialogMode.slug, data: payload })
    }
    setDialogOpen(false)
  }

  async function handleAiGenerate(e: React.FormEvent) {
    e.preventDefault()
    const id = parseInt(fabricId, 10)
    if (!id || id < 1) {
      toast.error('Enter a valid fabric ID')
      return
    }
    await generatePost.mutateAsync({
      fabricId: id,
      category: aiCategory || null,
      authorName: aiAuthorName || null,
      authorRole: 'AI Content',
    })
    setAiDialogOpen(false)
    setFabricId('')
    setAiAuthorName('')
    setAiCategory('')
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Blog Posts</h2>
          <p className="text-sm text-muted-foreground">Manage your blog content</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="mr-2 size-4" />
                AI Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAiGenerate}>
                <DialogHeader>
                  <DialogTitle>Generate Blog Post from Fabric</DialogTitle>
                  <DialogDescription>
                    AI will generate a blog post based on fabric data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <label className="space-y-2 text-sm font-medium">
                    <span>Fabric ID *</span>
                    <Input type="number" min={1} value={fabricId} onChange={(e) => setFabricId(e.target.value)} required />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Category</span>
                    <Input value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} placeholder="e.g. Market Trends" />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Author Name</span>
                    <Input value={aiAuthorName} onChange={(e) => setAiAuthorName(e.target.value)} placeholder="TkanMarket AI" />
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="submit" disabled={generatePost.isPending}>
                    {generatePost.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Generate & Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-center">Read</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 size-8 opacity-50" />
                  No blog posts found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs truncate font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">{post.category ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{post.authorName ?? '—'}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{post.readMinutes ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-primary"
                        title="Regenerate via AI"
                        disabled={regeneratePost.isPending}
                        onClick={() => regeneratePost.mutate(post.slug)}
                      >
                        <Sparkles className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(post)}>
                        <FileText className="size-4" />
                      </Button>
                      <AdminDeleteConfirmDialog
                        title="Delete blog post?"
                        description="This will soft-delete the blog post. It will be hidden from published posts but remain in the database for record-keeping. This action cannot be undone."
                        confirmLabel="Delete post"
                        onConfirm={async () => {
                          await deletePost.mutateAsync(post.slug)
                        }}
                      >
                        <Button variant="ghost" size="icon" className="size-8 text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AdminDeleteConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{dialogMode.type === 'create' ? 'New Blog Post' : 'Edit Blog Post'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  <span>Title *</span>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Slug *</span>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                <span>Content *</span>
                <Textarea className="min-h-[200px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Excerpt</span>
                <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  <span>Category</span>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Author</span>
                  <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Read Time (min)</span>
                  <Input type="number" min={1} value={form.readMinutes} onChange={(e) => setForm({ ...form, readMinutes: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                {(createPost.isPending || updatePost.isPending) && <Loader2 className="mr-2 size-4 animate-spin" />}
                {dialogMode.type === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
