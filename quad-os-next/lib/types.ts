export type Resource = {
  id: string
  user_id: string
  course_id: string | null
  title: string
  type: 'pdf' | 'link' | 'note'
  url: string | null
  content: string | null
  for_sale: boolean
  created_at: string
  courses: { name: string; code: string | null } | null
}
