import Link from 'next/link'
import { ChevronLeft, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/lib/academic-utils'
import type { Resource } from '@/lib/types'
import { DeckList } from './_components/deck-list'

export type Deck = {
  id: string
  title: string
  course_id: string | null
  resource_id: string | null
  created_at: string
  courses: { name: string } | null
  flashcards: { id: string }[]
}

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: decks }, { data: courses }, { data: resources }] = await Promise.all([
    supabase
      .from('flashcard_decks')
      .select('id, title, course_id, resource_id, created_at, courses(name), flashcards(id)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('courses').select('id, name, code, credits, semester, user_id, created_at').eq('user_id', user!.id).order('name'),
    supabase.from('resources').select('id, title, type, content, course_id, user_id, url, for_sale, created_at, courses(name, code)')
      .eq('user_id', user!.id).eq('type', 'note').not('content', 'is', null),
  ])

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
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              {(decks ?? []).length} deck{(decks ?? []).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <DeckList
        decks={(decks ?? []) as unknown as Deck[]}
        courses={(courses ?? []) as Course[]}
        noteResources={(resources ?? []) as unknown as Resource[]}
      />
    </div>
  )
}
