export type Listing = {
  id: string
  seller_id: string
  resource_id: string | null
  title: string
  description: string | null
  price: number
  condition: 'new' | 'like-new' | 'good' | 'fair'
  category: string
  images: string[]
  status: 'active' | 'sold' | 'reserved'
  created_at: string
}

export type ListingMessage = {
  id: string
  listing_id: string
  sender_id: string
  buyer_id: string | null
  content: string
  created_at: string
}

export const LISTING_CATEGORIES = [
  'Textbook',
  'Electronics',
  'Notes',
  'Furniture',
  'Clothing',
  'Other',
] as const

export const LISTING_CONDITIONS = [
  'new',
  'like-new',
  'good',
  'fair',
] as const

export function conditionBadge(condition: string): {
  label: string
  color: string
} {
  const map: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: 'text-finance bg-finance/10' },
    'like-new': { label: 'Like New', color: 'text-academic bg-academic/10' },
    good: { label: 'Good', color: 'text-marketplace bg-marketplace/10' },
    fair: { label: 'Fair', color: 'text-muted-foreground bg-muted' },
  }
  return map[condition] ?? { label: condition, color: 'text-muted-foreground bg-muted' }
}

export function formatListingDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
