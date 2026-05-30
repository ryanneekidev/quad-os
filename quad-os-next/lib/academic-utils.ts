export type Course = {
  id: string
  user_id: string
  name: string
  code: string | null
  credits: number
  semester: string | null
  created_at: string
}

export type Assignment = {
  id: string
  course_id: string
  user_id: string
  title: string
  due_date: string | null
  weight: number
  score: number | null
  status: 'pending' | 'submitted' | 'graded'
  created_at: string
}

export type CourseWithAssignments = Course & { assignments: Assignment[] }

export type AssignmentWithCourse = Assignment & {
  courses: { name: string; code: string | null } | null
}

export function computeCourseGrade(assignments: Assignment[]): number | null {
  const graded = assignments.filter(a => a.status === 'graded' && a.score !== null)
  if (graded.length === 0) return null
  const totalWeight = graded.reduce((s, a) => s + a.weight, 0)
  if (totalWeight === 0) return null
  return graded.reduce((s, a) => s + a.score! * a.weight, 0) / totalWeight
}

export function percentToGPA(p: number): number {
  if (p >= 93) return 4.0
  if (p >= 90) return 3.7
  if (p >= 87) return 3.3
  if (p >= 83) return 3.0
  if (p >= 80) return 2.7
  if (p >= 77) return 2.3
  if (p >= 73) return 2.0
  if (p >= 70) return 1.7
  if (p >= 67) return 1.3
  if (p >= 63) return 1.0
  if (p >= 60) return 0.7
  return 0.0
}

export function computeGPA(courses: CourseWithAssignments[]): number | null {
  const withGrades = courses
    .map(c => ({ grade: computeCourseGrade(c.assignments), credits: c.credits }))
    .filter((c): c is { grade: number; credits: number } => c.grade !== null)
  if (withGrades.length === 0) return null
  const totalCredits = withGrades.reduce((s, c) => s + c.credits, 0)
  if (totalCredits === 0) return null
  return withGrades.reduce((s, c) => s + percentToGPA(c.grade) * c.credits, 0) / totalCredits
}

export function gradeColor(grade: number): string {
  if (grade >= 90) return 'text-emerald-500'
  if (grade >= 80) return 'text-academic'
  if (grade >= 70) return 'text-amber-500'
  return 'text-destructive'
}

export function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 7) return `Due in ${diffDays} days`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
