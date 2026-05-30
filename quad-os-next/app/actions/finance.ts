'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Budget Categories ────────────────────────────────────────────────────────

export async function createCategory(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('budget_categories').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    monthly_limit: Number(formData.get('monthly_limit')) || 0,
    color: (formData.get('color') as string) || '#10b981',
  })

  if (error) return { error: error.message }
  revalidatePath('/finance')
  return { success: true }
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('budget_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/finance')
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const categoryId = formData.get('category_id') as string

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    category_id: categoryId || null,
    amount: Number(formData.get('amount')),
    description: formData.get('description') as string,
    type: formData.get('type') as 'income' | 'expense',
    source: 'manual',
    date: formData.get('date') as string,
  })

  if (error) return { error: error.message }
  revalidatePath('/finance')
  revalidatePath('/finance/transactions')
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/finance')
  revalidatePath('/finance/transactions')
}

// ─── Split Bills ──────────────────────────────────────────────────────────────

export async function createSplitBill(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const totalAmount = Number(formData.get('total_amount'))
  const numPeople = Math.max(1, Number(formData.get('num_people')) || 2)
  const perPerson = Math.round((totalAmount / numPeople) * 100) / 100

  const { data: bill, error: billError } = await supabase
    .from('split_bills')
    .insert({
      created_by: user.id,
      title: formData.get('title') as string,
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (billError || !bill) return { error: billError?.message ?? 'Failed to create bill' }

  const participants = Array.from({ length: numPeople }, () => ({
    bill_id: bill.id,
    user_id: user.id,
    amount_owed: perPerson,
    settled: false,
  }))

  const { error: pError } = await supabase
    .from('split_participants')
    .insert(participants)
  if (pError) return { error: pError.message }

  revalidatePath('/finance/split')
  return { success: true }
}

export async function settleParticipant(
  participantId: string,
  billId: string,
  amountOwed: number,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('split_participants')
    .update({ settled: true })
    .eq('id', participantId)
    .eq('user_id', user.id)

  const { data: bill } = await supabase
    .from('split_bills')
    .select('title')
    .eq('id', billId)
    .single()

  await supabase.from('transactions').insert({
    user_id: user.id,
    category_id: null,
    amount: amountOwed,
    description: `Split: ${bill?.title ?? 'Bill'}`,
    type: 'expense',
    source: 'split_settlement',
    date: new Date().toISOString().split('T')[0],
  })

  revalidatePath('/finance/split')
  revalidatePath('/finance')
}

// ─── Scholarships ─────────────────────────────────────────────────────────────

export async function seedScholarshipsIfEmpty(): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('scholarships')
    .select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return
  await supabase.from('scholarships').insert(SCHOLARSHIP_SEED)
}

const SCHOLARSHIP_SEED = [
  {
    title: 'STEM Excellence Award',
    provider: 'National Science Foundation',
    amount: 5000,
    deadline: '2026-09-15',
    min_gpa: 3.5,
    tags: ['engineering', 'stem', 'merit-based'],
    url: null,
  },
  {
    title: 'First-Generation Scholars Grant',
    provider: 'United Way',
    amount: 3000,
    deadline: '2026-10-01',
    min_gpa: 2.5,
    tags: ['first-generation', 'need-based'],
    url: null,
  },
  {
    title: 'Women in Tech Scholarship',
    provider: 'Google',
    amount: 10000,
    deadline: '2026-08-28',
    min_gpa: 3.3,
    tags: ['women', 'engineering', 'stem', 'technology'],
    url: null,
  },
  {
    title: 'Community Leadership Award',
    provider: 'Rotary International',
    amount: 2500,
    deadline: '2026-11-01',
    min_gpa: 3.0,
    tags: ['leadership', 'community-service'],
    url: null,
  },
  {
    title: 'Business Innovation Scholarship',
    provider: 'Chamber of Commerce',
    amount: 4000,
    deadline: '2026-09-30',
    min_gpa: 3.2,
    tags: ['business', 'entrepreneurship', 'merit-based'],
    url: null,
  },
  {
    title: 'Healthcare Heroes Bursary',
    provider: 'AMA Foundation',
    amount: 6000,
    deadline: '2026-10-15',
    min_gpa: 3.0,
    tags: ['healthcare', 'medicine', 'nursing', 'need-based'],
    url: null,
  },
  {
    title: 'Environmental Sustainability Grant',
    provider: 'Sierra Club Foundation',
    amount: 2000,
    deadline: '2026-12-01',
    min_gpa: null,
    tags: ['environment', 'sustainability', 'stem'],
    url: null,
  },
  {
    title: 'Arts & Humanities Award',
    provider: 'National Endowment for the Arts',
    amount: 3500,
    deadline: '2026-09-01',
    min_gpa: 3.0,
    tags: ['arts', 'humanities', 'creative'],
    url: null,
  },
  {
    title: 'International Student Scholarship',
    provider: 'Institute of International Education',
    amount: 5000,
    deadline: '2026-10-30',
    min_gpa: 3.4,
    tags: ['international', 'need-based'],
    url: null,
  },
  {
    title: 'Rural Student Support Fund',
    provider: 'USDA',
    amount: 4500,
    deadline: '2026-11-15',
    min_gpa: 2.8,
    tags: ['rural', 'need-based', 'agriculture'],
    url: null,
  },
  {
    title: 'Cybersecurity Talent Award',
    provider: 'NSA',
    amount: 8000,
    deadline: '2026-08-15',
    min_gpa: 3.5,
    tags: ['cybersecurity', 'technology', 'engineering', 'stem'],
    url: null,
  },
  {
    title: 'Social Work Excellence Grant',
    provider: 'NASW Foundation',
    amount: 2500,
    deadline: '2026-10-01',
    min_gpa: 3.0,
    tags: ['social-work', 'humanities', 'community-service'],
    url: null,
  },
  {
    title: 'Minority STEM Initiative',
    provider: 'UNCF',
    amount: 7500,
    deadline: '2026-09-15',
    min_gpa: 3.0,
    tags: ['stem', 'minority', 'engineering', 'need-based'],
    url: null,
  },
  {
    title: 'Pre-Law Scholars Award',
    provider: 'ABA Foundation',
    amount: 5000,
    deadline: '2026-11-01',
    min_gpa: 3.4,
    tags: ['law', 'humanities', 'merit-based'],
    url: null,
  },
  {
    title: 'Future Teachers Scholarship',
    provider: 'Department of Education',
    amount: 4000,
    deadline: '2026-10-15',
    min_gpa: 3.2,
    tags: ['education', 'teaching', 'need-based'],
    url: null,
  },
  {
    title: 'Veterans Education Award',
    provider: 'VFW Foundation',
    amount: 6000,
    deadline: '2026-12-15',
    min_gpa: null,
    tags: ['veterans', 'need-based', 'merit-based'],
    url: null,
  },
  {
    title: 'Food Science Innovation Grant',
    provider: 'IFT Foundation',
    amount: 3000,
    deadline: '2026-09-01',
    min_gpa: 3.0,
    tags: ['food-science', 'agriculture', 'stem'],
    url: null,
  },
  {
    title: 'Entrepreneurship Fund',
    provider: 'Kauffman Foundation',
    amount: 5000,
    deadline: '2026-11-30',
    min_gpa: null,
    tags: ['entrepreneurship', 'business', 'technology'],
    url: null,
  },
  {
    title: 'Music & Performing Arts Bursary',
    provider: 'Grammy Foundation',
    amount: 2000,
    deadline: '2026-10-30',
    min_gpa: null,
    tags: ['arts', 'music', 'creative'],
    url: null,
  },
  {
    title: 'Undergraduate Research Grant',
    provider: 'National Institutes of Health',
    amount: 9000,
    deadline: '2026-08-01',
    min_gpa: 3.6,
    tags: ['research', 'stem', 'medicine', 'merit-based'],
    url: null,
  },
]
