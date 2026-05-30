export type StudySession = {
  course: string
  assignment: string
  hours: number
  focus: string
}

export type PlanDay = {
  date: string
  sessions: StudySession[]
}

export type StudyPlan = { plan: PlanDay[] }

export type Flashcard = { front: string; back: string }

async function aiPost<T>(action: string, payload: object): Promise<T> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'AI request failed')
  }
  return res.json() as Promise<T>
}

export const generateStudyPlan = (
  assignments: object[],
  hoursPerDay: number
) => aiPost<StudyPlan>('study_planner', { assignments, hoursPerDay })

export const generateFlashcards = async (text: string): Promise<Flashcard[]> => {
  const data = await aiPost<{ cards: Flashcard[] }>('flashcard_generator', { text })
  return data.cards
}

export const analyzeSpending = async (transactions: object[]): Promise<string> => {
  const data = await aiPost<{ analysis: string }>('spending_insights', { transactions })
  return data.analysis
}

export const suggestPrice = (item: string, condition: string) =>
  aiPost<{ min: number; max: number; reasoning: string }>('price_suggester', { item, condition })
