'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MapPin, Users, Check, ArrowRight } from 'lucide-react'
import { joinStudySession, leaveStudySession } from '@/app/actions/social'
import { formatSessionDate, type StudySession } from '@/lib/social-utils'

export function StudySessionPreview({
  sessions,
  userSessionIds: initial,
  userId,
}: {
  sessions: StudySession[]
  userSessionIds: Set<string>
  userId: string
}) {
  const [userSessionIds, setUserSessionIds] = useState(new Set(initial))
  const [isPending, startTransition] = useTransition()

  function handleJoinLeave(sessionId: string, isJoined: boolean) {
    startTransition(async () => {
      if (isJoined) {
        await leaveStudySession(sessionId)
        setUserSessionIds(prev => { const n = new Set(prev); n.delete(sessionId); return n })
      } else {
        await joinStudySession(sessionId)
        setUserSessionIds(prev => new Set(prev).add(sessionId))
      }
    })
  }

  return (
    <section className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Study sessions</h2>
        <Link
          href="/social/study"
          className="flex items-center gap-1 text-sm font-medium text-social hover:opacity-80 transition-opacity"
        >
          See all <ArrowRight size={13} />
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-border rounded-2xl">
          <p className="text-sm font-medium">No upcoming sessions</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Start or join a study group</p>
          <Link
            href="/social/study"
            className="px-4 py-2 rounded-xl bg-social text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse sessions
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isJoined = userSessionIds.has(session.id)
            const isOwner = session.created_by === userId
            const count = session.study_session_participants.length
            const isFull = session.max_participants !== null && count >= session.max_participants

            return (
              <div
                key={session.id}
                className={`bg-card border rounded-2xl p-4 transition-shadow hover:shadow-sm ${
                  isJoined ? 'border-social/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{session.title}</p>
                    {session.courses && (
                      <p className="text-xs text-academic mt-0.5 font-medium">
                        {session.courses.code ? `${session.courses.code} · ` : ''}
                        {session.courses.name}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-right flex-shrink-0">
                    {formatSessionDate(session.starts_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {session.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={10} className="flex-shrink-0" />
                        {session.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={10} className="flex-shrink-0" />
                      {count}{session.max_participants ? `/${session.max_participants}` : ''}
                    </span>
                  </div>

                  {isOwner ? (
                    <span className="text-xs text-social font-semibold">Yours</span>
                  ) : (
                    <button
                      onClick={() => handleJoinLeave(session.id, isJoined)}
                      disabled={isPending || (isFull && !isJoined)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${
                        isJoined
                          ? 'bg-social/15 text-social border border-social/30'
                          : isFull
                          ? 'border border-border text-muted-foreground cursor-not-allowed'
                          : 'border border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {isJoined && <Check size={11} />}
                      {isJoined ? 'Joined' : isFull ? 'Full' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
