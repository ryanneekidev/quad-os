'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Play, Sparkles, Loader2, Layers } from 'lucide-react'
import { generateFlashcards, type Flashcard } from '@/lib/claude'
import { createDeckWithCards, deleteDeck } from '@/app/actions/flashcards'
import type { Course } from '@/lib/academic-utils'
import type { Resource } from '@/lib/types'
import type { Deck } from '../page'

type Step = 'form' | 'preview'

export function DeckList({
  decks,
  courses,
  noteResources,
}: {
  decks: Deck[]
  courses: Course[]
  noteResources: Resource[]
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [generating, setGenerating] = useState(false)
  const [saving, startSaving] = useTransition()
  const [isPending, startTransition] = useTransition()
  const [previewCards, setPreviewCards] = useState<Flashcard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [selectedResource, setSelectedResource] = useState('')

  function openDialog() {
    setOpen(true)
    setStep('form')
    setPreviewCards([])
    setError(null)
    setTitle('')
    setCourseId('')
    setSourceText('')
    setSelectedResource('')
  }

  function handleResourceSelect(resourceId: string) {
    setSelectedResource(resourceId)
    if (resourceId) {
      const r = noteResources.find(r => r.id === resourceId)
      if (r?.content) setSourceText(r.content)
    }
  }

  async function handleGenerate() {
    if (!sourceText.trim()) { setError('Paste some content to generate from.'); return }
    setError(null)
    setGenerating(true)
    try {
      const cards = await generateFlashcards(sourceText)
      setPreviewCards(cards)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
    } finally {
      setGenerating(false)
    }
  }

  function handleSave() {
    if (!title.trim()) { setError('Please enter a deck title.'); return }
    startSaving(async () => {
      const result = await createDeckWithCards(
        title,
        courseId || null,
        selectedResource || null,
        previewCards
      )
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openDialog}
          className="flex items-center gap-1.5 text-sm font-medium text-academic hover:underline"
        >
          <Plus size={16} /> New deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Layers size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No flashcard decks yet.</p>
          <button onClick={openDialog} className="mt-2 text-sm text-academic hover:underline">
            Create your first deck →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="group flex flex-col gap-3 bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug">{deck.title}</p>
                  {deck.courses?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{deck.courses.name}</p>
                  )}
                </div>
                <button
                  onClick={() => startTransition(() => deleteDeck(deck.id))}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {deck.flashcards.length} card{deck.flashcards.length !== 1 ? 's' : ''}
              </p>

              <Link
                href={`/academic/flashcards/${deck.id}`}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-academic/10 text-academic text-sm font-medium hover:bg-academic/20 transition-colors"
              >
                <Play size={14} /> Review
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                {step === 'form' ? 'Generate flashcards' : `Preview — ${previewCards.length} cards`}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {step === 'form' ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Deck title *</label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Calculus II — Chapter 5"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Course</label>
                    <select
                      value={courseId}
                      onChange={e => setCourseId(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— None —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {noteResources.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Source from saved note</label>
                      <select
                        value={selectedResource}
                        onChange={e => handleResourceSelect(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— Paste manually —</option>
                        {noteResources.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Study material *</label>
                    <textarea
                      value={sourceText}
                      onChange={e => setSourceText(e.target.value)}
                      rows={8}
                      placeholder="Paste your lecture notes, textbook excerpt, or any study material here…"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{sourceText.length} chars</p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {previewCards.map((card, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 text-sm">
                      <p className="font-medium">{card.front}</p>
                      <p className="text-muted-foreground mt-1">{card.back}</p>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="p-6 border-t border-border flex gap-2">
              {step === 'form' ? (
                <>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !sourceText.trim()}
                    className="flex-1 py-2 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {generating
                      ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                      : <><Sparkles size={14} /> Generate</>
                    }
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="flex-1 py-2 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save deck'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
