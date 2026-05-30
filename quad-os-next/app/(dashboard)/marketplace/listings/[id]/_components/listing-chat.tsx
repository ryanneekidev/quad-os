'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/actions/marketplace'
import type { ListingMessage } from '@/lib/marketplace-utils'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ─── Shared bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
  label,
}: {
  message: ListingMessage
  isMine: boolean
  label: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] text-muted-foreground px-1">{label}</span>
      <div
        className={`px-3 py-2 rounded-xl text-sm max-w-[75%] ${
          isMine ? 'bg-marketplace text-white' : 'bg-muted text-foreground'
        }`}
      >
        <p>{message.content}</p>
        <p className={`text-[10px] mt-0.5 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

// ─── Thread view (shared by buyer + seller) ──────────────────────────────────

function ChatThread({
  messages,
  userId,
  sellerId,
  otherLabel,
  onSend,
  isPending,
  placeholder,
}: {
  messages: ListingMessage[]
  userId: string
  sellerId: string
  otherLabel: string
  onSend: (text: string) => void
  isPending: boolean
  placeholder: string
}) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = text.trim()
    if (!msg) return
    setText('')
    onSend(msg)
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="h-64 overflow-y-auto p-3 space-y-3 bg-background">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-10">
            {placeholder}
          </p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === userId
          const label = isMine ? 'You' : otherLabel
          return (
            <MessageBubble key={m.id} message={m} isMine={isMine} label={label} />
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-border flex gap-2 p-2 bg-card"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="p-2 rounded-lg bg-marketplace text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ListingChat({
  listingId,
  initialMessages,
  userId,
  sellerId,
  names,
}: {
  listingId: string
  initialMessages: ListingMessage[]
  userId: string
  sellerId: string
  names: Record<string, string>
}) {
  const isSeller = userId === sellerId
  const [messages, setMessages] = useState(initialMessages)
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Realtime subscription — RLS ensures each user only receives their own messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`listing-${listingId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const msg = payload.new as ListingMessage
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [listingId, userId])

  function sendAs(text: string, buyerId: string) {
    startTransition(() => sendMessage(listingId, text, buyerId))
  }

  const displayName = (id: string) => names[id] ?? (id === sellerId ? 'Seller' : 'Buyer')

  // ── Buyer view ──────────────────────────────────────────────────────────────
  if (!isSeller) {
    const thread = messages.filter(
      (m) => m.buyer_id === userId || (m.sender_id === sellerId && m.buyer_id === userId),
    )
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Chat with seller</h2>
        <ChatThread
          messages={thread}
          userId={userId}
          sellerId={sellerId}
          otherLabel={displayName(sellerId)}
          onSend={(text) => sendAs(text, userId)}
          isPending={isPending}
          placeholder="No messages yet. Ask the seller a question."
        />
      </div>
    )
  }

  // ── Seller view ─────────────────────────────────────────────────────────────

  // Group messages by buyer_id, excluding null (legacy rows)
  const buyerIds = Array.from(
    new Set(
      messages
        .map((m) => m.buyer_id)
        .filter((b): b is string => !!b && b !== sellerId),
    ),
  )

  const activeThread = selectedBuyerId
    ? messages.filter((m) => m.buyer_id === selectedBuyerId)
    : []

  if (buyerIds.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Messages</h2>
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No messages from buyers yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Messages{' '}
        <span className="text-sm font-normal text-muted-foreground">
          ({buyerIds.length} conversation{buyerIds.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {selectedBuyerId ? (
        <div className="space-y-2">
          <button
            onClick={() => setSelectedBuyerId(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} /> All conversations
          </button>
          <ChatThread
            messages={activeThread}
            userId={userId}
            sellerId={sellerId}
            otherLabel={displayName(selectedBuyerId)}
            onSend={(text) => sendAs(text, selectedBuyerId)}
            isPending={isPending}
            placeholder="No messages yet."
          />
        </div>
      ) : (
        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
          {buyerIds.map((buyerId, idx) => {
            const thread = messages.filter((m) => m.buyer_id === buyerId)
            const last = thread[thread.length - 1]
            const unread = thread.some((m) => m.sender_id !== sellerId)
            return (
              <button
                key={buyerId}
                onClick={() => setSelectedBuyerId(buyerId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-marketplace/10 text-marketplace flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {displayName(buyerId).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{displayName(buyerId)}</p>
                  {last && (
                    <p className="text-xs text-muted-foreground truncate">
                      {last.sender_id === sellerId ? 'You: ' : ''}
                      {last.content}
                    </p>
                  )}
                </div>
                {last && (
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(last.created_at)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
