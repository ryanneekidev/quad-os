import { createClient } from '@/lib/supabase/server'
import { Receipt } from 'lucide-react'
import {
  type BudgetCategory,
  type TransactionWithCategory,
} from '@/lib/finance-utils'
import { TransactionList } from '../_components/transaction-list'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('name'),
    supabase
      .from('transactions')
      .select('*, budget_categories(name, color)')
      .eq('user_id', user!.id)
      .order('date', { ascending: false }),
  ])

  const typedCategories = (categories ?? []) as BudgetCategory[]
  const typedTransactions = (transactions ?? []) as TransactionWithCategory[]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-finance/10 text-finance">
          <Receipt size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {typedTransactions.length} total
          </p>
        </div>
      </div>

      <TransactionList
        categories={typedCategories}
        transactions={typedTransactions}
      />
    </div>
  )
}
