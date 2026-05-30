import { createClient } from '@/lib/supabase/server'
import { CreditCard } from 'lucide-react'
import type { SplitBill } from '@/lib/finance-utils'
import { SplitBillList } from './_components/split-bill-list'

export default async function SplitPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; amount?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { title: defaultTitle, amount: defaultAmountStr } = await searchParams
  const defaultAmount = defaultAmountStr ? Number(defaultAmountStr) : undefined

  const { data: bills } = await supabase
    .from('split_bills')
    .select('*, split_participants(*)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  const typedBills = (bills ?? []) as SplitBill[]
  const totalOwed = typedBills.reduce((sum, bill) => {
    return (
      sum +
      bill.split_participants
        .filter((p) => !p.settled)
        .reduce((s, p) => s + Number(p.amount_owed), 0)
    )
  }, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-finance/10 text-finance">
            <CreditCard size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Split Bills</h1>
            <p className="text-sm text-muted-foreground">
              {typedBills.length} bill{typedBills.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {totalOwed > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Unsettled
            </p>
            <p className="text-xl font-bold text-amber-500">
              ${totalOwed.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <SplitBillList
        bills={typedBills}
        defaultOpen={!!defaultTitle}
        defaultTitle={defaultTitle}
        defaultAmount={defaultAmount}
      />
    </div>
  )
}
