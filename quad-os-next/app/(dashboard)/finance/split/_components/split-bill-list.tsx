'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, CheckCircle, Circle } from 'lucide-react'
import { createSplitBill, settleParticipant } from '@/app/actions/finance'
import { formatCurrency, type SplitBill } from '@/lib/finance-utils'

export function SplitBillList({
  bills,
  defaultOpen = false,
  defaultTitle,
  defaultAmount,
}: {
  bills: SplitBill[]
  defaultOpen?: boolean
  defaultTitle?: string
  defaultAmount?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createSplitBill(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bills</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-finance hover:underline"
        >
          <Plus size={16} /> Create bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No split bills yet.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-sm text-finance hover:underline"
          >
            Create your first bill →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const total = Number(bill.total_amount)
            const settled = bill.split_participants.filter((p) => p.settled)
            const unsettled = bill.split_participants.filter((p) => !p.settled)
            const settledAmount = settled.reduce(
              (s, p) => s + Number(p.amount_owed),
              0,
            )
            const perPerson =
              bill.split_participants.length > 0
                ? total / bill.split_participants.length
                : total

            return (
              <div
                key={bill.id}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{bill.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bill.split_participants.length} person
                      {bill.split_participants.length !== 1 ? 's' : ''} ·{' '}
                      {formatCurrency(perPerson)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {settled.length}/{bill.split_participants.length} settled
                    </p>
                  </div>
                </div>

                {bill.split_participants.length > 0 && (
                  <>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-finance rounded-full transition-all"
                        style={{
                          width: `${(settledAmount / total) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      {bill.split_participants.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {p.settled ? (
                              <CheckCircle
                                size={15}
                                className="text-finance flex-shrink-0"
                              />
                            ) : (
                              <Circle
                                size={15}
                                className="text-muted-foreground flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-muted-foreground">
                              Person {idx + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              {formatCurrency(Number(p.amount_owed))}
                            </span>
                            {!p.settled && (
                              <button
                                onClick={() =>
                                  startTransition(() =>
                                    settleParticipant(
                                      p.id,
                                      bill.id,
                                      Number(p.amount_owed),
                                    ),
                                  )
                                }
                                disabled={isPending}
                                className="text-xs text-finance border border-finance/30 rounded-md px-2 py-0.5 hover:bg-finance/10 disabled:opacity-50 transition-colors"
                              >
                                Settle
                              </button>
                            )}
                            {p.settled && (
                              <span className="text-xs text-finance">
                                Paid ✓
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-1">Create split bill</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Settling a share auto-logs it as an expense in your Finance
              tracker.
            </p>
            <form ref={formRef} onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Bill title *</label>
                <input
                  name="title"
                  required
                  placeholder="Campus café study session"
                  defaultValue={defaultTitle}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Total ($) *</label>
                  <input
                    name="total_amount"
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    placeholder="48.00"
                    defaultValue={defaultAmount}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Split between</label>
                  <input
                    name="num_people"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={2}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
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
                  className="flex-1 py-2 rounded-lg bg-finance text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Creating…' : 'Create bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
