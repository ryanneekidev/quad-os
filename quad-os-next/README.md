# Quad — Student Life OS

> **Everything campus, one place.**

Quad is a unified platform that replaces the 5–7 apps a university student currently juggles. Built around four interlocking pillars — Academic, Finance, Social, and Marketplace — it's designed to feel like a natural extension of student life, not another tool to manage.

The pillars are not four separate apps. They are deeply woven together through AI and shared data. A textbook in your Academic library has a "Sell" button. A study group in Social automatically offers to split costs via Finance. A scholarship alert fires when your GPA crosses a threshold. This interconnection is the product's soul.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| File storage | Supabase Storage |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Deployment | Vercel |

---

## Features

### Academic
- **Course manager** — add courses with credits, code, and semester
- **Assignment tracker** — due dates, weights, and submission status
- **Grade tracker + GPA projector** — live weighted GPA with a what-if slider for upcoming assignments
- **AI Study Planner** — paste your deadlines and available hours, get a day-by-day Claude-generated schedule
- **Resource library** — upload PDFs, save links, write notes; tagged to courses
- **AI Flashcard generator** — upload a PDF or paste notes, get up to 20 front/back cards with confidence-based review

### Finance
- **Budget tracker** — monthly categories with spending limits and color-coded progress bars
- **Transaction log** — manual entry; sales from Marketplace auto-create income entries
- **AI Spending Insights** — Claude analyses your last 30 days and gives three concrete, student-specific tips
- **Scholarship finder** — 20 seeded scholarships with AI matching based on your major, GPA, and year; deadline alerts for awards closing within 14 days
- **Bill splitter** — create a split bill, add participants, assign amounts, mark shares as settled

### Social
- **Club directory** — searchable and filterable; join/leave clubs; AI club matcher suggests top 5 based on your profile
- **Event board** — post and RSVP to events; events with costs have a "Split cost" button that pre-fills a Finance bill
- **Study session board** — post a session linked to one of your courses; browse and join open sessions

### Marketplace
- **Listings feed** — search and filter by category; cards show condition, price, and posting date
- **New listing form** — with an AI price suggester that recommends a fair range for your item and condition
- **In-app chat** — buyer messages seller directly on a listing via Supabase Realtime
- **Resource → listing bridge** — from the Academic library, one click pre-fills a listing with your resource's title

### Cross-pillar threads
| Trigger | Result |
|---|---|
| Mark a listing as sold | Income transaction auto-logged in Finance |
| "Sell this" on an Academic resource | Pre-filled Marketplace listing form |
| Event with a cost → "Split cost" | Pre-filled Finance bill splitter |
| GPA crosses 3.5 | Scholarship alert banner on Academic page |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/quad-os.git
cd quad-os/quad-os-next
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema SQL from `quad-spec.md` (section 3) in the Supabase SQL editor
3. Enable Email auth under **Authentication → Providers**
4. Create a `resources` storage bucket (public) under **Storage**

### 3. Environment variables

Create a `.env.local` file in `quad-os-next/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

This project is configured for zero-config deployment on Vercel.

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com) — set the **root directory** to `quad-os-next`
3. Add the four environment variables above under **Project Settings → Environment Variables**
4. Deploy

---

## AI Integration

All Claude calls go through a single API route at `/api/ai` with an `action` discriminator field. The API key never leaves the server.

| Action | Trigger | Input | Output |
|---|---|---|---|
| `study_planner` | User requests schedule | Assignments + available hours/day | Day-by-day plan |
| `flashcard_generator` | PDF/text upload | Extracted text | Array of `{front, back}` |
| `spending_insights` | "Analyse my spending" | 30-day transactions | Markdown analysis |
| `scholarship_matcher` | Scholarship page load | User profile | Ranked scholarship IDs |
| `price_suggester` | New listing form | Item name + condition | `{min, max, reasoning}` |
| `club_matcher` | Club directory load | User profile | Ranked club IDs |

---

## Project Structure

```
app/
  (auth)/            — Login & signup
  (dashboard)/
    page.tsx         — Home dashboard with live pillar summaries
    academic/        — Courses, assignments, GPA, planner, flashcards, resources
    finance/         — Budget, transactions, scholarships, bill splitter
    social/          — Events, clubs, study sessions
    marketplace/     — Listings, new listing, listing detail + chat
  api/ai/            — Single Claude API route
components/
  sidebar.tsx        — Collapsible dark sidebar + mobile bottom tab bar
  dashboard-shell.tsx
lib/
  supabase/          — Server + client Supabase instances
  claude.ts          — Typed wrappers for /api/ai actions
  academic-utils.ts
  finance-utils.ts
  social-utils.ts
  marketplace-utils.ts
```

---

*Built for students, by a student.*
