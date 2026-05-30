'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, MapPin, Users, Check, BookOpen } from 'lucide-react'
import { createStudySession, joinStudySession, leaveStudySession } from '@/app/actions/social'
import { formatSessionDate, type StudySession } from '@/lib/social-utils'
import type { Course } from '@/lib/academic-utils'

export function StudyBoard({
  sessions,
  userSessionIds: initialUserSessionIds,
  userId,
  courses,
}: {
  sessions: StudySession[]
  userSessionIds: Set<string>
  userId: string
  courses: Pick<Course, 'id' | 'name' | 'code'>[]
}) {
  const [userSessionIds, setUserSessionIds] = useState(
    new Set(initialUserSessionIds),
  )
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const now = new Date().toISOString().slice(0, 16)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createStudySession(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  function handleJoinLeave(sessionId: string, isJoined: boolean) {
    startTransition(async () => {
      if (isJoined) {
        await leaveStudySession(sessionId)
        setUserSessionIds((prev) => {
          const next = new Set(prev)
          next.delete(sessionId)
          return next
        })
      } else {
        await joinStudySession(sessionId)
        setUserSessionIds((prev) => new Set(prev).add(sessionId))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Open sessions</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-social hover:underline"
        >
          <Plus size={16} /> Post session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No upcoming study sessions.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-sm text-social hover:underline"
          >
            Start one →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isJoined = userSessionIds.has(session.id)
            const participantCount = session.study_session_participants.length
            const isFull =
              session.max_participants !== null &&
              participantCount >= session.max_participants
            const isOwner = session.created_by === userId

            return (
              <div
                key={session.id}
                className={`bg-card border rounded-xl p-4 ${
                  isJoined ? 'border-social/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{session.title}</p>
                    {session.courses && (
                      <p className="text-xs text-academic mt-0.5">
                        {session.courses.code
                          ? `${session.courses.code} · `
                          : ''}
                        {session.courses.name}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground text-right flex-shrink-0">
                    {formatSessionDate(session.starts_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {session.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={11} />
                      {session.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={11} />
                    {participantCount}
                    {session.max_participants
                      ? `/${session.max_participants}`
                      : ''}{' '}
                    {participantCount === 1 ? 'person' : 'people'}
                  </span>
                </div>

                <div className="mt-3">
                  {isOwner ? (
                    <span className="text-xs text-social font-medium">
                      Your session
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinLeave(session.id, isJoined)}
                      disabled={isPending || (isFull && !isJoined)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        isJoined
                          ? 'bg-social/10 text-social border border-social/30'
                          : isFull
                            ? 'border border-border text-muted-foreground cursor-not-allowed'
                            : 'border border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {isJoined && <Check size={12} />}
                      {isJoined ? 'Joined' : isFull ? 'Full' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Post a study session</h3>
            <form ref={formRef} onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  name="title"
                  required
                  placeholder="Calculus II exam prep"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Course</label>
                <select
                  name="course_id"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not linked to a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} · ` : ''}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  name="location"
                  placeholder="Library Room 3, Campus café…"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start *</label>
                  <input
                    name="starts_at"
                    type="datetime-local"
                    required
                    min={now}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max people</label>
                  <input
                    name="max_participants"
                    type="number"
                    min={2}
                    max={50}
                    placeholder="No limit"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Bring your textbook, focusing on chapters 4–6…"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-social text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Posting…' : 'Post session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
