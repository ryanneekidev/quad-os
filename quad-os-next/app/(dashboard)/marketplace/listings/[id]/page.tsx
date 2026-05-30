import { notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Listing, ListingMessage } from '@/lib/marketplace-utils'
import { ListingDetail } from './_components/listing-detail'
import { ListingChat } from './_components/listing-chat'

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const isSeller = listing.seller_id === user!.id

  const { data: messages } = await supabase
    .from('listing_messages')
    .select('*')
    .eq('listing_id', id)
    .order('created_at', { ascending: true })

  const typedMessages = (messages ?? []) as ListingMessage[]

  // Collect every unique user ID in this listing's conversation
  const participantIds = Array.from(new Set([
    listing.seller_id,
    ...typedMessages.map((m) => m.sender_id),
    ...(typedMessages.map((m) => m.buyer_id).filter(Boolean) as string[]),
  ]))

  // Fetch display names from auth.user_metadata using the admin client
  const adminClient = createAdminClient()
  const userResults = await Promise.all(
    participantIds.map((uid) => adminClient.auth.admin.getUserById(uid)),
  )

  const names: Record<string, string> = Object.fromEntries(
    userResults
      .filter((r) => r.data?.user)
      .map((r) => [
        r.data!.user!.id,
        (r.data!.user!.user_metadata?.full_name as string | undefined) ?? null,
      ])
      .filter((entry): entry is [string, string] => !!entry[1]),
  )

  const sellerName = names[listing.seller_id] ?? 'Seller'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <ListingDetail
        listing={listing as Listing}
        isOwner={isSeller}
        sellerName={sellerName}
      />
      <ListingChat
        listingId={id}
        initialMessages={typedMessages}
        userId={user!.id}
        sellerId={listing.seller_id}
        names={names}
      />
    </div>
  )
}
