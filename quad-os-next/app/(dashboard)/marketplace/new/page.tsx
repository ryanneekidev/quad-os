import { ShoppingBag } from 'lucide-react'
import { NewListingForm } from './_components/new-listing-form'

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    title?: string
    category?: string
    resource_id?: string
  }>
}) {
  const { title, category, resource_id } = await searchParams

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-marketplace/10 text-marketplace">
          <ShoppingBag size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New listing</h1>
          {resource_id && (
            <p className="text-sm text-marketplace mt-0.5">
              Pre-filled from your Resource Library ✦
            </p>
          )}
        </div>
      </div>

      <NewListingForm
        defaultTitle={title}
        defaultCategory={category}
        resourceId={resource_id}
      />
    </div>
  )
}
