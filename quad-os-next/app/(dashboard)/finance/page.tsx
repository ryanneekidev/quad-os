import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wallet, Receipt, GraduationCap, CreditCard, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import {
  computeMonthlySpending,
  formatCurrency,
  type BudgetCategory,
  type TransactionWithCategory,
} from '@/lib/finance-utils'
import { BudgetOverview } from './_components/budget-overview'
import { TransactionList } from './_components/transaction-list'
import { SpendingInsights } from './_components/spending-insights'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('budget_categories').select('*').eq('user_id', user!.id).order('name'),
    supabase.from('transactions').select('*, budget_categories(name, color)').eq('user_id', user!.id).order('date', { ascending: false }).limit(100),
  ])

  const typedCategories = (categories ?? []) as BudgetCategory[]
  const typedTransactions = (transactions ?? []) as TransactionWithCategory[]

  const totalIncome   = typedTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = typedTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses
  const monthlyExpenses = typedCategories.reduce((s, c) => s + computeMonthlySpending(typedTransactions, c.id), 0)

  const SUB_LINKS = [
    { href: '/finance/transactions', icon: Receipt,       label: 'All Transactions', sub: 'Full history' },
    { href: '/finance/scholarships', icon: GraduationCap, label: 'Scholarships',      sub: 'AI-matched awards' },
    { href: '/finance/split',        icon: CreditCard,    label: 'Split Bills',       sub: 'Share expenses' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-finance/10 text-finance flex items-center justify-center flex-shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
            <p className="text-sm text-muted-foreground">
              {typedCategories.length} categor{typedCategories.length !== 1 ? 'ies' : 'y'} · {typedTransactions.length} transactions
            </p>
          </div>
        </div>

        {/* Balance + monthly stats */}
        <div className="flex items-start gap-5 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Balance</p>
            <p className={`text-3xl font-black leading-none mt-1 ${balance >= 0 ? 'text-finance' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </p>
            {monthlyExpenses > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(monthlyExpenses)} this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Income / Expenses stat chips */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-finance/8 border border-finance/20 flex-1">
            <TrendingUp size={15} className="text-finance flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Income</p>
              <p className="text-sm font-bold text-finance">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20 flex-1">
            <TrendingDown size={15} className="text-destructive flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Expenses</p>
              <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      )}

      <BudgetOverview categories={typedCategories} transactions={typedTransactions} />
      <TransactionList categories={typedCategories} transactions={typedTransactions.slice(0, 8)} />
      <SpendingInsights transactions={typedTransactions} />

      {/* Sub-section quick links */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUB_LINKS.map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ borderTopColor: '#10b981', borderTopWidth: 2 }}
            >
              <div className="w-9 h-9 rounded-xl bg-finance/10 text-finance flex items-center justify-center flex-shrink-0">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-finance group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
