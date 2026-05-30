export type BudgetCategory = {
  id: string
  user_id: string
  name: string
  monthly_limit: number
  color: string
}

export type Transaction = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string
  type: 'income' | 'expense'
  source: 'manual' | 'marketplace_sale' | 'split_settlement'
  date: string
  created_at: string
}

export type TransactionWithCategory = Transaction & {
  budget_categories: { name: string; color: string } | null
}

export type SplitBill = {
  id: string
  created_by: string
  title: string
  total_amount: number
  event_id: string | null
  created_at: string
  split_participants: SplitParticipant[]
}

export type SplitParticipant = {
  id: string
  bill_id: string
  user_id: string
  amount_owed: number
  settled: boolean
}

export type Scholarship = {
  id: string
  title: string
  provider: string
  amount: number
  deadline: string
  min_gpa: number | null
  tags: string[]
  url: string | null
}

export function computeMonthlySpending(
  transactions: Transaction[],
  categoryId: string,
): number {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  return transactions
    .filter(
      (t) =>
        t.category_id === categoryId &&
        t.type === 'expense' &&
        t.date >= monthStart,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

export function budgetBarWidth(spent: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min((spent / limit) * 100, 100)
}

export function budgetStatusColor(spent: number, limit: number): string {
  if (limit === 0) return 'text-muted-foreground'
  const pct = spent / limit
  if (pct >= 1) return 'text-destructive'
  if (pct >= 0.75) return 'text-amber-500'
  return 'text-finance'
}

export function budgetBarColor(spent: number, limit: number): string {
  if (limit === 0) return 'bg-muted'
  const pct = spent / limit
  if (pct >= 1) return 'bg-destructive'
  if (pct >= 0.75) return 'bg-amber-500'
  return 'bg-finance'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatTransactionDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}
