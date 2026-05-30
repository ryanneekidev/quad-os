import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FlashcardReview } from './_components/flashcard-review'

export type FlashcardRow = {
  id: string
  deck_id: string
  front: string
  back: string
  confidence: number
}

type DeckWithCards = {
  id: string
  title: string
  courses: { name: string } | null
  flashcards: FlashcardRow[]
}

export default async function DeckReviewPage({
  params,
}: {
  params: Promise<{ deckId: string }>
}) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deck } = await supabase
    .from('flashcard_decks')
    .select('id, title, courses(name), flashcards(*)')
    .eq('id', deckId)
    .eq('user_id', user!.id)
    .single()

  if (!deck) notFound()

  const typed = deck as unknown as DeckWithCards
  const sorted = [...typed.flashcards].sort((a, b) => a.confidence - b.confidence)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/academic/flashcards"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Flashcards
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{typed.title}</h1>
          {typed.courses?.name && (
            <p className="text-sm text-muted-foreground mt-0.5">{typed.courses.name}</p>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">This deck has no cards.</p>
        </div>
      ) : (
        <FlashcardReview cards={sorted} />
      )}
    </div>
  )
}
