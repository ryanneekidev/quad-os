import Link from 'next/link'
import { ChevronLeft, Library } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Resource } from '@/lib/types'
import type { Course } from '@/lib/academic-utils'
import { ResourceList } from './_components/resource-list'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: resources }, { data: courses }, { data: listings }] =
    await Promise.all([
      supabase
        .from('resources')
        .select('*, courses(name, code)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('courses')
        .select('id, name, code, credits, semester, user_id, created_at')
        .eq('user_id', user!.id)
        .order('name'),
      supabase
        .from('listings')
        .select('id, resource_id')
        .eq('seller_id', user!.id)
        .not('resource_id', 'is', null),
    ])

  // resource_id → listing_id for direct links
  const listingByResource = Object.fromEntries(
    (listings ?? [])
      .filter((l) => l.resource_id)
      .map((l) => [l.resource_id as string, l.id as string]),
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/academic"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Academic
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-academic/10 text-academic">
            <Library size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
            <p className="text-sm text-muted-foreground">
              {(resources ?? []).length} resource{(resources ?? []).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <ResourceList
        resources={(resources ?? []) as Resource[]}
        courses={(courses ?? []) as Course[]}
        listingByResource={listingByResource}
      />
    </div>
  )
}
