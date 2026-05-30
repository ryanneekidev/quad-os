'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag } from 'lucide-react'
import {
  conditionBadge,
  formatListingDate,
  LISTING_CATEGORIES,
  type Listing,
} from '@/lib/marketplace-utils'

const CATEGORY_ICONS: Record<string, string> = {
  Textbook: '📚',
  Electronics: '💻',
  Notes: '📝',
  Furniture: '🛋️',
  Clothing: '👕',
  Other: '📦',
}

export function ListingFeed({ listings, userId }: { listings: Listing[]; userId: string }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = listings.filter(l => {
    const matchSearch =
      search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === null || l.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search listings…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-marketplace/40"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeCategory === null
              ? 'bg-marketplace text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          All
        </button>
        {LISTING_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-marketplace text-white shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-marketplace/10 text-marketplace flex items-center justify-center mb-3">
            <ShoppingBag size={22} />
          </div>
          <p className="text-sm font-medium">
            {listings.length === 0 ? 'No listings yet' : 'No listings match your search'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {listings.length === 0 ? 'Be the first to post something' : 'Try a different search or category'}
          </p>
          <Link
            href="/marketplace/new"
            className="px-4 py-2 rounded-xl bg-marketplace text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Post a listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => {
            const badge = conditionBadge(listing.condition)
            const isOwner = listing.seller_id === userId
            const thumb = listing.images?.[0]

            return (
              <Link
                key={listing.id}
                href={`/marketplace/listings/${listing.id}`}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{ borderTopColor: '#f59e0b', borderTopWidth: 2 }}
              >
                {/* Image */}
                <div className="h-36 bg-muted flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    CATEGORY_ICONS[listing.category] ?? '📦'
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight line-clamp-2 flex-1">{listing.title}</p>
                    <p className="text-base font-black text-marketplace flex-shrink-0">
                      ${Number(listing.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                    {isOwner && (
                      <span className="text-[10px] text-marketplace bg-marketplace/10 px-2 py-0.5 rounded-full font-semibold">
                        Yours
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-auto">{formatListingDate(listing.created_at)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
