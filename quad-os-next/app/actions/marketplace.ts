'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createListing(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const resourceId = (formData.get('resource_id') as string) || null
  const imageUrl = (formData.get('image_url') as string) || null

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      resource_id: resourceId,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      price: Number(formData.get('price')),
      condition: formData.get('condition') as string,
      category: formData.get('category') as string,
      images: imageUrl ? [imageUrl] : [],
      status: 'active',
    })
    .select()
    .single()

  if (error || !listing) return { error: error?.message ?? 'Failed to create listing' }

  // Cross-pillar: mark the source resource as for_sale
  if (resourceId) {
    await supabase
      .from('resources')
      .update({ for_sale: true })
      .eq('id', resourceId)
      .eq('user_id', user.id)
  }

  revalidatePath('/marketplace')
  revalidatePath('/academic/resources')
  return { id: listing.id }
}

export async function updateListingStatus(
  id: string,
  status: 'active' | 'sold' | 'reserved',
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('title, price')
    .eq('id', id)
    .eq('seller_id', user.id)
    .single()

  if (fetchError || !listing) return { error: fetchError?.message ?? 'Listing not found' }

  const { error: updateError } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (updateError) return { error: updateError.message }

  // Cross-pillar: sold → auto income transaction in Finance
  if (status === 'sold') {
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      category_id: null,
      amount: Number(listing.price),
      description: `Sale: ${listing.title}`,
      type: 'income',
      source: 'marketplace_sale',
      date: new Date().toISOString().split('T')[0],
    })
    if (txError) return { error: `Listing marked sold but finance sync failed: ${txError.message}` }
    revalidatePath('/finance')
    revalidatePath('/finance/transactions')
  }

  revalidatePath('/marketplace')
  revalidatePath(`/marketplace/listings/${id}`)
  return {}
}

export async function sendMessage(
  listingId: string,
  content: string,
  buyerId: string,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('listing_messages').insert({
    listing_id: listingId,
    sender_id: user.id,
    buyer_id: buyerId,
    content,
  })
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)
  revalidatePath('/marketplace')
}
