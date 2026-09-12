#!/usr/bin/env bash
# =================================================================
# Life RPG — Git History Setup Script
# Run this once after installing Git and pushing to GitHub:
#   chmod +x setup-git-history.sh && ./setup-git-history.sh
# =================================================================

set -e

echo "Initializing Life RPG git history..."

git init
git config user.email "hunter@liferpg.app"
git config user.name "Life RPG Dev"

# ---- COMMIT 1: Scaffold + DB Schema ----
git add supabase/ .env.example next.config.ts tailwind.config.ts \
    src/types/ src/lib/ src/proxy.ts package.json tsconfig.json .gitignore
git commit -m "feat(phase0a): scaffold Next.js 16 + Supabase + progression engine

- Initialize Next.js 16 App Router with TypeScript + Tailwind CSS
- Add Supabase SSR client factories (server + browser singletons)
- Add proxy.ts session refresh (Next.js 16 middleware replacement)
- Add full DB schema: users_profile, quests, quest_completions,
  shadow_soldiers, shop_purchases with Row Level Security policies
- Add complete_quest() Postgres function (atomic, SECURITY DEFINER)
- Add purchase_shop_item() Postgres function (validates balance)
- Add auto-profile trigger on auth.users insert
- Add server-side progression engine: XP curve 100*n^1.8,
  reward tables, rank thresholds, Shadow Army catalog, Shop catalog
- Add Zod validation schemas for all API inputs
- Add shared TypeScript types for all DB rows and API shapes
- Add .env.example listing all required environment variables"

# ---- COMMIT 2: Auth + API + Barebones CRUD ----
git add src/app/api/ src/app/layout.tsx src/app/page.tsx \
    src/app/\(auth\)/ src/app/\(app\)/layout.tsx \
    src/hooks/ src/lib/query-provider.tsx
git commit -m "feat(phase0b): auth pages, API routes, TanStack Query, game events

- Add login/signup pages with accessible error/loading states
- Add protected app layout with server-side session guard
- Add API routes: GET/POST /api/quests, PATCH/DELETE /api/quests/[id],
  POST /api/quests/[id]/complete (delegates to DB function),
  GET /api/profile, POST /api/shop/purchase
- Server computes all XP/gold rewards — client never submits values
- Add TanStack Query provider with 30s staleTime, no 4xx retry
- Add useQuests hook with optimistic completion + rollback pattern
- Add useProfile hook for user data
- Add GameEventsProvider: global event bus for animation triggers
- Add useHasAwakened hook (localStorage, UI-only, explicitly exempt
  from game-state localStorage ban per spec Section 2)"

# ---- COMMIT 3: Theme + UI system + all app pages ----
git add src/app/globals.css src/app/\(app\)/ \
    src/components/ README.md
git commit -m "feat(phase1+2): THE SYSTEM theme, UI components, all app pages

Phase 1 — Theme skin:
- Apply void palette (#0B0B10/#14141C) + glow blue + gold + violet
- Glass panel mixin: translucent dark bg, 1px glowing border, blur
- Orbitron/Rajdhani/IBM Plex Sans via next/font/google
- Custom Tailwind tokens: colors, fonts, keyframes (stamp, flicker, etc)
- RankBadge: SVG hexagonal insignia, color-coded E→D→C→B→A→S
- XPBar: animated fill with trailing glow, aria progressbar
- DisciplineIcon: thin-line SVG per discipline, color-coded
- Toaster: imperative global toast, aria-live polite

Phase 2 — Game screens:
- Status Window: rank badge, XP bar, gold/mana/streak, 5 stat bars,
  daily quest list with completion, loading/empty/error states
- Quest Log: filter tabs, create-quest form with difficulty radio +
  reward preview, quest list with complete/delete, full a11y
- Stat Allocation: discipline progress bars with descriptions
- Shadow Army: 21-soldier grid, unlocked show glowing animated eyes,
  locked show lock + unlock requirement; abstract SVG bust
- Shop: grouped by category, balance display, can-afford check,
  purchase with optimistic invalidation
- AppShell: sidebar nav (desktop), hamburger menu + bottom nav (mobile)
- LevelUpOverlay: spring-scale animation, gold glow, particle rings
- RankUpOverlay: full-screen takeover, scan lines, pulsing badge
- QuestCompleteToast: slide-in from right with XP/Gold summary"

echo ""
echo "✓ Git history created with 3 commits."
echo ""
echo "Next steps:"
echo "  1. Create a public GitHub repo"
echo "  2. git remote add origin https://github.com/YOUR_USERNAME/life-rpg.git"
echo "  3. git branch -M main"
echo "  4. git push -u origin main"
