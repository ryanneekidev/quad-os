'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDeckWithCards(
  title: string,
  courseId: string | null,
  resourceId: string | null,
  cards: { front: string; back: string }[]
): Promise<{ error?: string; deckId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: deck, error: deckErr } = await supabase
    .from('flashcard_decks')
    .insert({ user_id: user.id, title, course_id: courseId || null, resource_id: resourceId || null })
    .select('id')
    .single()

  if (deckErr || !deck) return { error: deckErr?.message ?? 'Failed to create deck' }

  const { error: cardsErr } = await supabase
    .from('flashcards')
    .insert(cards.map(c => ({ deck_id: deck.id, front: c.front, back: c.back, confidence: 0 })))

  if (cardsErr) {
    await supabase.from('flashcard_decks').delete().eq('id', deck.id)
    return { error: cardsErr.message }
  }

  revalidatePath('/academic/flashcards')
  return { deckId: deck.id }
}

export async function updateCardConfidence(cardId: string, confidence: number): Promise<void> {
  const supabase = await createClient()
  await supabase.from('flashcards').update({ confidence }).eq('id', cardId)
}

export async function deleteDeck(deckId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('flashcard_decks').delete().eq('id', deckId).eq('user_id', user.id)
  revalidatePath('/academic/flashcards')
}
