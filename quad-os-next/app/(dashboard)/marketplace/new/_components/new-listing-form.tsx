'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createListing } from '@/app/actions/marketplace'
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/marketplace-utils'

type PriceSuggestion = { min: number; max: number; reasoning: string }

export function NewListingForm({
  defaultTitle,
  defaultCategory,
  resourceId,
}: {
  defaultTitle?: string
  defaultCategory?: string
  resourceId?: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [condition, setCondition] = useState<string>('good')
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  async function handleSuggestPrice() {
    if (!title.trim()) return
    setSuggesting(true)
    setSuggestError(null)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'price_suggester',
          item: title,
          condition,
        }),
      })
      if (!res.ok) throw new Error('Failed to get suggestion')
      const data = await res.json()
      setSuggestion(data)
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSuggesting(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('condition', condition)
    if (resourceId) formData.set('resource_id', resourceId)
    setError(null)
    startTransition(async () => {
      const result = await createListing(undefined, formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/marketplace/listings/${result.id}`)
      }
    })
  }

  const conditionLabels: Record<string, string> = {
    'new': 'New',
    'like-new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {resourceId && (
        <input type="hidden" name="resource_id" value={resourceId} />
      )}

      <div>
        <label className="text-sm font-medium">Title *</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Calculus II textbook, 3rd edition"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Condition details, edition, what's included…"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Category *</label>
          <select
            name="category"
            required
            defaultValue={defaultCategory ?? 'Textbook'}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Condition *</label>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {LISTING_CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  condition === c
                    ? 'border-marketplace bg-marketplace/10 text-marketplace'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {conditionLabels[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price + AI suggester */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Price ($) *</label>
          <button
            type="button"
            onClick={handleSuggestPrice}
            disabled={suggesting || !title.trim()}
            className="flex items-center gap-1 text-xs text-marketplace hover:underline disabled:opacity-50"
          >
            <Sparkles size={11} />
            {suggesting ? 'Thinking…' : 'AI suggest'}
          </button>
        </div>
        <input
          name="price"
          type="number"
          required
          min={0.01}
          step={0.01}
          defaultValue={
            suggestion
              ? ((suggestion.min + suggestion.max) / 2).toFixed(2)
              : undefined
          }
          key={suggestion ? 'with-suggestion' : 'no-suggestion'}
          placeholder="0.00"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {suggestion && (
          <div className="mt-2 p-3 rounded-lg bg-marketplace/5 border border-marketplace/20 text-xs space-y-1">
            <p className="font-medium text-marketplace">
              Suggested: ${suggestion.min.toFixed(2)} – ${suggestion.max.toFixed(2)}
            </p>
            <p className="text-muted-foreground">{suggestion.reasoning}</p>
          </div>
        )}
        {suggestError && (
          <p className="mt-1 text-xs text-destructive">{suggestError}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Image URL</label>
        <input
          name="image_url"
          type="url"
          placeholder="https://… (optional)"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-marketplace text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? 'Posting…' : 'Post listing'}
        </button>
      </div>
    </form>
  )
}
