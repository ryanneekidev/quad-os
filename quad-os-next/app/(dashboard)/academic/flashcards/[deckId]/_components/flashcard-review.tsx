'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { RotateCcw, ChevronLeft } from 'lucide-react'
import { updateCardConfidence } from '@/app/actions/flashcards'
import type { FlashcardRow } from '../page'

const CONFIDENCE_BUTTONS = [
  { value: 0 as const, label: 'Again',  style: 'border-red-500/40 text-red-500 hover:bg-red-500/10' },
  { value: 1 as const, label: 'Hard',   style: 'border-orange-500/40 text-orange-500 hover:bg-orange-500/10' },
  { value: 2 as const, label: 'Good',   style: 'border-academic/40 text-academic hover:bg-academic/10' },
  { value: 3 as const, label: 'Easy',   style: 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10' },
]

export function FlashcardReview({ cards }: { cards: FlashcardRow[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [done, setDone] = useState(false)
  const [, startTransition] = useTransition()

  const current = cards[index]
  const progress = reviewed / cards.length

  function handleConfidence(confidence: 0 | 1 | 2 | 3) {
    startTransition(() => updateCardConfidence(current.id, confidence))
    const next = reviewed + 1
    setReviewed(next)
    if (next >= cards.length) {
      setDone(true)
    } else {
      setFlipped(false)
      setTimeout(() => setIndex(i => i + 1), 50)
    }
  }

  function restart() {
    setIndex(0)
    setFlipped(false)
    setReviewed(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="text-5xl">🎉</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Session complete!</h2>
          <p className="text-muted-foreground mt-1">
            You reviewed all {cards.length} cards.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw size={14} /> Review again
          </button>
          <Link
            href="/academic/flashcards"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ChevronLeft size={14} /> Back to decks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{reviewed} / {cards.length} reviewed</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-academic rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={{ perspective: '1200px' }}>
        <div
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer select-none"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            minHeight: '220px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Question</p>
            <p className="text-xl font-medium text-center leading-relaxed">{current.front}</p>
            <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-academic/5 border border-academic/20 rounded-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-academic uppercase tracking-wide mb-4">Answer</p>
            <p className="text-lg text-center leading-relaxed">{current.back}</p>
          </div>
        </div>
      </div>

      {/* Confidence buttons — only after flip */}
      <div className={`space-y-3 transition-opacity duration-200 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <p className="text-xs text-center text-muted-foreground">How well did you know this?</p>
        <div className="grid grid-cols-4 gap-2">
          {CONFIDENCE_BUTTONS.map(btn => (
            <button
              key={btn.value}
              onClick={() => handleConfidence(btn.value)}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${btn.style}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Card {index + 1} of {cards.length}
      </p>
    </div>
  )
}
