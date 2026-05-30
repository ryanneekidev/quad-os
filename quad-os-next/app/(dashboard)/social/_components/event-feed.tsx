'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Plus, MapPin, DollarSign, Check, CalendarDays, Users } from 'lucide-react'
import { createEvent, rsvpEvent, cancelRsvp } from '@/app/actions/social'
import { formatEventDate, type Event } from '@/lib/social-utils'

export function EventFeed({
  events,
  userRsvpIds,
  userId,
}: {
  events: Event[]
  userRsvpIds: Set<string>
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [hasCost, setHasCost] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const now = new Date().toISOString().slice(0, 16)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('has_cost', hasCost ? 'true' : 'false')
    setError(null)
    startTransition(async () => {
      const result = await createEvent(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setHasCost(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Upcoming events</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-social hover:opacity-80 transition-opacity"
        >
          <Plus size={15} /> Post event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-border rounded-2xl">
          <p className="text-sm font-medium">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Be the first to post one</p>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-xl bg-social text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Post an event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const hasRsvp = userRsvpIds.has(event.id)
            const rsvpCount = event.event_rsvps.length
            const splitUrl = `/finance/split?title=${encodeURIComponent(event.title)}${event.cost_per_person ? `&amount=${event.cost_per_person}` : ''}`

            return (
              <div
                key={event.id}
                className={`bg-card border rounded-2xl p-4 transition-shadow hover:shadow-sm ${
                  hasRsvp ? 'border-social/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{event.title}</p>
                    {event.clubs && (
                      <p className="text-xs text-social mt-0.5 font-medium">{event.clubs.name}</p>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-social/10 text-social text-xs font-medium">
                      <CalendarDays size={10} />
                      {formatEventDate(event.starts_at)}
                    </span>
                    {rsvpCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 justify-end">
                        <Users size={10} /> {rsvpCount} going
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {event.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={11} className="flex-shrink-0" />
                      {event.location}
                    </span>
                  )}
                  {event.has_cost && event.cost_per_person != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign size={11} className="flex-shrink-0" />
                      ${Number(event.cost_per_person).toFixed(2)}/person
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startTransition(() => hasRsvp ? cancelRsvp(event.id) : rsvpEvent(event.id))}
                    disabled={isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${
                      hasRsvp
                        ? 'bg-social/15 text-social border border-social/30'
                        : 'border border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {hasRsvp && <Check size={11} />}
                    {hasRsvp ? 'Going' : 'RSVP'}
                  </button>

                  {event.has_cost && (
                    <Link
                      href={splitUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-finance/30 text-finance bg-finance/8 hover:bg-finance/15 transition-colors"
                    >
                      <DollarSign size={11} />
                      Split cost
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-5">Post an event</h3>
            <form ref={formRef} onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  name="title" required placeholder="Calculus study session at the library"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description" rows={2} placeholder="What's happening?"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  name="location" placeholder="Campus café, Room 204…"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start *</label>
                  <input
                    name="starts_at" type="datetime-local" required min={now}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End</label>
                  <input
                    name="ends_at" type="datetime-local" min={now}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer select-none">
                <input
                  type="checkbox" checked={hasCost}
                  onChange={e => setHasCost(e.target.checked)}
                  className="rounded accent-social"
                />
                This event has a cost
              </label>
              {hasCost && (
                <div>
                  <label className="text-sm font-medium">Cost per person ($)</label>
                  <input
                    name="cost_per_person" type="number" min={0.01} step={0.01} placeholder="12.00"
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-social/50"
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => { setOpen(false); setHasCost(false) }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-social text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Posting…' : 'Post event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
