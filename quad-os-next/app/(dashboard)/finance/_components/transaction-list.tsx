'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { createTransaction, deleteTransaction } from '@/app/actions/finance'
import {
  formatCurrency,
  formatTransactionDate,
  type BudgetCategory,
  type TransactionWithCategory,
} from '@/lib/finance-utils'

export function TransactionList({
  categories,
  transactions,
}: {
  categories: BudgetCategory[]
  transactions: TransactionWithCategory[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().split('T')[0]

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createTransaction(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-finance hover:underline"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-sm text-finance hover:underline"
          >
            Log your first transaction →
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 px-4 py-3"
            >
              <div
                className={`p-1.5 rounded-lg flex-shrink-0 ${
                  t.type === 'income'
                    ? 'bg-finance/10 text-finance'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {t.type === 'income' ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {t.budget_categories?.name
                    ? `${t.budget_categories.name} · `
                    : ''}
                  {formatTransactionDate(t.date)}
                  {t.source !== 'manual' && (
                    <span className="ml-1 text-finance/70">
                      ({t.source === 'marketplace_sale' ? 'sale' : 'split'})
                    </span>
                  )}
                </p>
              </div>
              <p
                className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-finance' : 'text-foreground'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(t.amount))}
              </p>
              <button
                onClick={() => startTransition(() => deleteTransaction(t.id))}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all ml-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add transaction</h3>
            <form ref={formRef} onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    name="type"
                    required
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount ($) *</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    placeholder="25.00"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <input
                  name="description"
                  required
                  placeholder="Coffee at campus café"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    name="category_id"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={today}
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
                  {isPending ? 'Adding…' : 'Add transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
