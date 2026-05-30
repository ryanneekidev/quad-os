'use client'

import { useState, useTransition, useRef } from 'react'
import {
  Plus, Trash2, ExternalLink, FileText, Link2,
  StickyNote, ShoppingBag, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createResource, deleteResource } from '@/app/actions/resources'
import type { Course } from '@/lib/academic-utils'
import type { Resource } from '@/lib/types'

const TYPE_CONFIG = {
  pdf:  { icon: FileText,   label: 'PDF',  style: 'text-red-500 bg-red-500/10' },
  link: { icon: Link2,      label: 'Link', style: 'text-blue-500 bg-blue-500/10' },
  note: { icon: StickyNote, label: 'Note', style: 'text-amber-500 bg-amber-500/10' },
} as const

export function ResourceList({
  resources,
  courses,
  listingByResource,
}: {
  resources: Resource[]
  courses: Course[]
  listingByResource: Record<string, string>
}) {
  const [filter, setFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [type, setType] = useState<'link' | 'pdf' | 'note'>('link')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = filter === 'all'
    ? resources
    : resources.filter(r => r.course_id === filter)

  function openDialog() {
    setError(null)
    setType('link')
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    formData.set('type', type)

    if (type === 'pdf') {
      const file = fileRef.current?.files?.[0]
      if (!file) { setError('Please select a PDF file.'); return }
      setUploading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const path = `${user!.id}/${Date.now()}-${file.name}`
        const { error: upErr } = await supabase.storage.from('resources').upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(path)
        formData.set('url', publicUrl)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    startTransition(async () => {
      const result = await createResource(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setDialogOpen(false)
        formRef.current?.reset()
      }
    })
  }

  const filters = [
    { id: 'all', label: 'All' },
    ...courses.map(c => ({ id: c.id, label: c.name })),
  ]

  return (
    <>
      {/* Filter + Add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-academic text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={openDialog}
          className="flex items-center gap-1.5 text-sm font-medium text-academic hover:underline"
        >
          <Plus size={16} /> Add resource
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No resources yet.</p>
          <button onClick={openDialog} className="mt-2 text-sm text-academic hover:underline">
            Add your first resource →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => {
            const { icon: Icon, label, style } = TYPE_CONFIG[r.type]
            return (
              <div
                key={r.id}
                className="group flex flex-col gap-3 bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${style}`}>
                    <Icon size={12} /> {label}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.url && (
                      <a
                        href={r.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Open"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => startTransition(() => deleteResource(r.id))}
                      disabled={isPending}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug">{r.title}</p>
                  {r.courses?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.courses.name}</p>
                  )}
                  {r.type === 'note' && r.content && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.content}</p>
                  )}
                </div>

                {/* Marketplace bridge */}
                {listingByResource[r.id] ? (
                  <Link
                    href={`/marketplace/listings/${listingByResource[r.id]}`}
                    className="flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-marketplace/40 bg-marketplace/10 text-marketplace"
                  >
                    <ShoppingBag size={12} />
                    Listed in Marketplace ↗
                  </Link>
                ) : (
                  <Link
                    href={`/marketplace/new?title=${encodeURIComponent(r.title)}&category=Textbook&resource_id=${r.id}`}
                    className="flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-marketplace/30 hover:text-marketplace transition-colors"
                  >
                    <ShoppingBag size={12} />
                    Sell this →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-5">Add resource</h3>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              {/* Type pills */}
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="mt-1.5 flex gap-2">
                  {(['link', 'pdf', 'note'] as const).map(t => (
                    <button
                      key={t} type="button" onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                        type === t
                          ? 'border-academic bg-academic/10 text-academic'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  name="title" required placeholder="e.g. Lecture notes — Week 3"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Course */}
              <div>
                <label className="text-sm font-medium">Course</label>
                <select
                  name="course_id"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— None —</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Type-specific inputs */}
              {type === 'pdf' && (
                <div>
                  <label className="text-sm font-medium">PDF file *</label>
                  <input
                    ref={fileRef} type="file" accept=".pdf"
                    className="mt-1 w-full text-sm text-muted-foreground cursor-pointer
                      file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                      file:text-sm file:font-medium file:bg-academic/10 file:text-academic
                      hover:file:bg-academic/20 file:cursor-pointer"
                  />
                </div>
              )}

              {type === 'link' && (
                <div>
                  <label className="text-sm font-medium">URL *</label>
                  <input
                    name="url" type="url" required placeholder="https://..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {type === 'note' && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    name="content" rows={5}
                    placeholder="Paste or type your notes here…"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              )}

              {/* Marketplace */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  name="for_sale" type="checkbox" value="true"
                  className="w-4 h-4 accent-marketplace rounded"
                />
                <span className="text-sm">List in Marketplace</span>
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => setDialogOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending || uploading}
                  className="flex-1 py-2 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {(uploading || isPending) && <Loader2 size={14} className="animate-spin" />}
                  {uploading ? 'Uploading…' : isPending ? 'Saving…' : 'Add resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
