'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createResource(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('resources').insert({
    user_id: user.id,
    course_id: (formData.get('course_id') as string) || null,
    title: formData.get('title') as string,
    type: formData.get('type') as string,
    url: (formData.get('url') as string) || null,
    content: (formData.get('content') as string) || null,
    for_sale: formData.get('for_sale') === 'true',
  })

  if (error) return { error: error.message }
  revalidatePath('/academic/resources')
  return { success: true }
}

export async function toggleForSale(id: string, forSale: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('resources')
    .update({ for_sale: forSale })
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/academic/resources')
}

export async function deleteResource(id: string, storagePath?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('resources').delete().eq('id', id).eq('user_id', user.id)
  if (storagePath) {
    await supabase.storage.from('resources').remove([storagePath])
  }
  revalidatePath('/academic/resources')
}
