'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { createCategory, deleteCategory } from '@/app/actions/finance'
import {
  computeMonthlySpending,
  budgetBarWidth,
  budgetBarColor,
  budgetStatusColor,
  formatCurrency,
  type BudgetCategory,
  type Transaction,
} from '@/lib/finance-utils'

const PRESET_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#f43f5e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

export function BudgetOverview({
  categories,
  transactions,
}: {
  categories: BudgetCategory[]
  transactions: Transaction[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('color', selectedColor)
    setError(null)
    startTransition(async () => {
      const result = await createCategory(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
        setSelectedColor(PRESET_COLORS[0])
      }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Budget categories</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-finance hover:opacity-80 transition-opacity"
        >
          <Plus size={15} /> Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-finance/10 text-finance flex items-center justify-center mb-3">
            <Wallet size={22} />
          </div>
          <p className="text-sm font-medium">No budget categories yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Set spending limits to track where your money goes</p>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-xl bg-finance text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Set up your budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const spent = computeMonthlySpending(transactions, cat.id)
            const limit = Number(cat.monthly_limit)
            const barW = budgetBarWidth(spent, limit)
            const barColor = budgetBarColor(spent, limit)
            const statusColor = budgetStatusColor(spent, limit)
            const pct = limit > 0 ? (spent / limit) * 100 : 0

            return (
              <div
                key={cat.id}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <p className="font-semibold text-sm">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${statusColor}`}>
                      {formatCurrency(spent)}
                      {limit > 0 && (
                        <span className="text-muted-foreground font-normal text-xs"> / {formatCurrency(limit)}</span>
                      )}
                    </p>
                    <button
                      onClick={() => startTransition(() => deleteCategory(cat.id))}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {limit > 0 && (
                  <>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 text-right">
                      {pct.toFixed(0)}% used
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">Add budget category</h3>
            <form ref={formRef} onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category name *</label>
                <input
                  name="name" required placeholder="Food & dining"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-finance/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly limit ($)</label>
                <input
                  name="monthly_limit" type="number" min={0} step={0.01} placeholder="200"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-finance/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                        selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-ring' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-finance text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Adding…' : 'Add category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
