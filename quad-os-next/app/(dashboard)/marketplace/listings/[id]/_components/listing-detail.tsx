'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { updateListingStatus, deleteListing } from '@/app/actions/marketplace'
import { conditionBadge, type Listing } from '@/lib/marketplace-utils'

const CATEGORY_ICONS: Record<string, string> = {
  Textbook: '📚',
  Electronics: '💻',
  Notes: '📝',
  Furniture: '🛋️',
  Clothing: '👕',
  Other: '📦',
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-finance/10 text-finance border border-finance/25',
  reserved: 'bg-amber-500/10 text-amber-600 border border-amber-300/40',
  sold:     'bg-muted text-muted-foreground border border-border',
}

export function ListingDetail({
  listing,
  isOwner,
  sellerName,
}: {
  listing: Listing
  isOwner: boolean
  sellerName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  function handleStatus(status: 'active' | 'sold' | 'reserved') {
    setActionError(null)
    startTransition(async () => {
      const result = await updateListingStatus(listing.id, status)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteListing(listing.id)
      router.push('/marketplace')
    })
  }

  const badge = conditionBadge(listing.condition)
  const thumb = listing.images?.[0]

  return (
    <div className="space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back to listings
      </Link>

      {/* Image */}
      {thumb ? (
        <img src={thumb} alt={listing.title} className="w-full h-60 object-cover rounded-2xl border border-border" />
      ) : (
        <div className="w-full h-52 bg-muted rounded-2xl border border-border flex items-center justify-center text-7xl">
          {CATEGORY_ICONS[listing.category] ?? '📦'}
        </div>
      )}

      {/* Info card */}
      <div
        className="bg-card border border-border rounded-2xl p-5 space-y-4"
        style={{ borderTopColor: '#f59e0b', borderTopWidth: 3 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {listing.category}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[listing.status]}`}>
                {listing.status}
              </span>
            </div>
          </div>
          <p className="text-3xl font-black text-marketplace flex-shrink-0">
            ${Number(listing.price).toFixed(2)}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Listed by <span className="font-semibold text-foreground">{isOwner ? 'you' : sellerName}</span>
        </p>

        {listing.description && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-1 border-t border-border">
            {listing.description}
          </p>
        )}
      </div>

      {/* Owner actions */}
      {isOwner && listing.status === 'active' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleStatus('reserved')}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 transition-colors"
          >
            Mark Reserved
          </button>
          <button
            onClick={() => handleStatus('sold')}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-finance text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Mark Sold ✓
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {isOwner && listing.status === 'reserved' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleStatus('active')}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Relist
          </button>
          <button
            onClick={() => handleStatus('sold')}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-finance text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Mark Sold ✓
          </button>
        </div>
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {listing.status === 'sold' && (
        <div className="flex items-center gap-2.5 py-3.5 px-4 rounded-2xl bg-muted border border-border text-sm text-muted-foreground">
          <CheckCircle size={16} className="text-finance flex-shrink-0" />
          <span>
            This item has been sold.
            {isOwner && <span className="text-finance font-medium ml-1">Income logged in Finance ✓</span>}
          </span>
        </div>
      )}
    </div>
  )
}
