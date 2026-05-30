import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function extractJSON(text: string): string {
  return text.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  try {
    switch (action) {

      case 'study_planner': {
        const { assignments, hoursPerDay } = body
        const today = new Date().toISOString().split('T')[0]

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: 'You are an academic study planner. Always respond with valid JSON only — no markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Create a day-by-day study schedule for these assignments:

${JSON.stringify(assignments, null, 2)}

Rules:
- Today is ${today}
- Available study hours per day: ${hoursPerDay}
- Prioritize by deadline proximity (sooner = higher priority) and weight (higher = more important)
- Don't exceed ${hoursPerDay} total hours per day
- Don't schedule past an assignment's due date
- Only include days where study is needed

Return this exact JSON shape:
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "sessions": [
        { "course": "string", "assignment": "string", "hours": 1.5, "focus": "specific actionable study tip" }
      ]
    }
  ]
}`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
        const data = JSON.parse(extractJSON(text))
        return NextResponse.json(data)
      }

      case 'flashcard_generator': {
        const { text } = body

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: 'You are an expert flashcard creator. Always respond with valid JSON only — no markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Create up to 20 high-quality flashcards from this study material:

${text}

Guidelines:
- Each card tests exactly one concept
- Front: a clear question or concept prompt
- Back: a concise answer (1–3 sentences max)
- Prioritise definitions, formulas, key relationships, and processes

Return this exact JSON shape:
[{ "front": "question", "back": "answer" }]`,
          }],
        })

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]'
        const cards = JSON.parse(extractJSON(responseText))
        return NextResponse.json({ cards })
      }

      case 'spending_insights': {
        const { transactions } = body

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `You are a friendly financial advisor for university students. Analyse these transactions from the last 30 days and provide helpful insights.

Transactions:
${JSON.stringify(transactions, null, 2)}

Write a short, friendly analysis (3–4 sentences) then give exactly 3 concrete, student-specific tips. Use simple markdown with bullet points for the tips. Be encouraging, not judgmental.`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        return NextResponse.json({ analysis: text })
      }

      case 'price_suggester': {
        const { item, condition } = body

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: 'You are a student marketplace pricing expert. Always respond with valid JSON only — no markdown.',
          messages: [{
            role: 'user',
            content: `Suggest a fair second-hand price for this item in a university student marketplace:

Item: ${item}
Condition: ${condition}

Return:
{ "min": number, "max": number, "reasoning": "one sentence explanation" }`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
        return NextResponse.json(JSON.parse(extractJSON(text)))
      }

      case 'scholarship_matcher': {
        const { profile, scholarships } = body

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'You are a scholarship matching assistant. Always respond with valid JSON only — no markdown.',
          messages: [{
            role: 'user',
            content: `Match this student profile to the best scholarships.

Student profile:
${JSON.stringify(profile)}

Available scholarships:
${JSON.stringify(scholarships)}

Return the top 5 matching scholarship IDs ranked by relevance:
{ "matches": ["id1", "id2", "id3", "id4", "id5"] }`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
        return NextResponse.json(JSON.parse(extractJSON(text)))
      }

      case 'club_matcher': {
        const { profile, clubs } = body

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'You are a club recommendation assistant. Always respond with valid JSON only — no markdown.',
          messages: [{
            role: 'user',
            content: `Match this student to the best campus clubs based on their major, year of study, and each club's category and description.

Student profile:
${JSON.stringify(profile)}

Available clubs:
${JSON.stringify(clubs)}

Return the top 5 most relevant club IDs ranked by fit:
{ "matches": ["id1", "id2", "id3", "id4", "id5"] }`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
        return NextResponse.json(JSON.parse(extractJSON(text)))
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error(`AI [${action}] error:`, err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI request failed' },
      { status: 500 }
    )
  }
}
