'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function createCourse(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('courses').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    code: (formData.get('code') as string) || null,
    credits: Number(formData.get('credits')) || 3,
    semester: (formData.get('semester') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/academic')
  return { success: true }
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('courses').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/academic')
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function createAssignment(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const courseId = formData.get('course_id') as string

  const { error } = await supabase.from('assignments').insert({
    user_id: user.id,
    course_id: courseId,
    title: formData.get('title') as string,
    due_date: (formData.get('due_date') as string) || null,
    weight: Number(formData.get('weight')) || 10,
    status: 'pending',
  })

  if (error) return { error: error.message }
  revalidatePath('/academic')
  revalidatePath(`/academic/${courseId}`)
  return { success: true }
}

export async function gradeAssignment(
  id: string,
  courseId: string,
  score: number
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('assignments')
    .update({ score, status: 'graded' })
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/academic')
  revalidatePath(`/academic/${courseId}`)
}

export async function submitAssignment(id: string, courseId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('assignments')
    .update({ status: 'submitted' })
    .eq('id', id)
    .eq('user_id', user.id)
  revalidatePath('/academic')
  revalidatePath(`/academic/${courseId}`)
}

export async function deleteAssignment(id: string, courseId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('assignments').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/academic')
  revalidatePath(`/academic/${courseId}`)
}
