import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingBag, Plus } from 'lucide-react'
import type { Listing } from '@/lib/marketplace-utils'
import { ListingFeed } from './_components/listing-feed'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const typedListings = (listings ?? []) as Listing[]
  const myListings = typedListings.filter(l => l.seller_id === user!.id)

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-marketplace/10 text-marketplace flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              {typedListings.length} active listing{typedListings.length !== 1 ? 's' : ''}
              {myListings.length > 0 && ` · ${myListings.length} yours`}
            </p>
          </div>
        </div>
        <Link
          href="/marketplace/new"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-marketplace text-white text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <Plus size={15} /> New listing
        </Link>
      </div>

      <ListingFeed listings={typedListings} userId={user!.id} />
    </div>
  )
}
