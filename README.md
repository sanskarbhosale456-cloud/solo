# Life RPG — THE SYSTEM

> Transform your real-world tasks into an RPG progression system. Level up in real life.

A full-stack gamification web app with hunter-interface aesthetics — XP, levels, rank, stats, streaks, a virtual economy, and a shadow army you build through real achievement.

**Live Demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Features

- 🗡 **Quest System** — Create quests, daily quests, and gates (big projects)
- 📈 **Non-linear XP Progression** — Each level costs exponentially more XP (computed server-side)
- 🏅 **Hunter Ranks** — E → D → C → B → A → S, unlocked at levels 1/10/20/35/50/70
- ⚡ **Attributes** — STR, AGI, VIT, INT, PER grow via discipline-tagged quest completion
- 🔥 **Streaks** — Track consecutive days of activity
- 💰 **Economy** — Earn Gold & Mana Crystals; spend in the Shop on cosmetics
- 👥 **Shadow Army** — Unlock shadow soldiers by completing quest milestones
- 🎨 **Shop** — Profile frames, soldier skins, UI themes
- 🔐 **Secure** — Row Level Security at DB layer; all game logic computed server-side

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| Database + Auth | Supabase (Postgres + built-in Auth + RLS) |
| Data Fetching | TanStack Query v5 (optimistic updates) |
| Animation | Framer Motion + CSS Animations |
| Hosting | Vercel |

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/life-rpg.git
cd life-rpg
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the Supabase database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. This creates all tables, RLS policies, triggers, and the `complete_quest` / `purchase_shop_item` DB functions

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel + Supabase)

1. Push the repo to GitHub (must be public for hackathon)
2. Import the repo into [vercel.com](https://vercel.com)
3. Add the three environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Deploy — Vercel auto-connects to the Supabase production DB

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only — never expose to client) |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (for OG metadata) |

---

## Security Model

- **Row Level Security** — Every table has RLS enabled with `auth.uid() = user_id` policies. Data isolation is enforced at the database layer, not just application code.
- **Server-side game logic** — XP, level, rank, currency rewards are computed by a Postgres function (`complete_quest`) called from a server-side API route with the service role key. The client can never submit or modify these values.
- **Atomic transactions** — Quest completion and shop purchases are single DB transactions — no race conditions, no partial states.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + fonts + providers
│   ├── page.tsx            # Auth check + redirect
│   ├── (auth)/             # Login + signup pages
│   ├── (app)/              # Protected routes (session-gated)
│   │   ├── dashboard/      # Status Window
│   │   ├── quests/         # Quest Log
│   │   ├── stats/          # Stat Allocation
│   │   ├── army/           # Shadow Army
│   │   └── shop/           # Shop
│   └── api/                # API routes (server-side only)
├── components/
│   ├── layout/             # AppShell navigation
│   ├── ui/                 # Design system primitives
│   ├── game/               # Level-up / rank-up overlays
│   └── pages/              # Page-level client components
├── hooks/                  # React hooks (data + game events)
├── lib/
│   ├── supabase/           # Client + server Supabase factories
│   ├── progression/        # XP curve, reward tables, shop catalog
│   └── validation.ts       # Zod schemas
└── types/                  # Shared TypeScript types
```

---

## XP Curve

Level `n` → `n+1` requires: `round(100 × n^1.8 / 10) × 10` XP

| Level | XP Required |
|---|---|
| 1 → 2 | 100 XP |
| 5 → 6 | 1,150 XP |
| 10 → 11 | 6,310 XP |
| 20 → 21 | 20,720 XP |
| 50 → 51 | ~99,500 XP |

---

## License

MIT
