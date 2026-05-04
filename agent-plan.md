# Implementation Plan: Family Points Economy App (PWA)

## 1. Context

We are building a **Progressive Web App (PWA)** for family points economy. Parents assign tasks with point values to their kids; kids complete tasks, earn points, and can redeem them for rewards. The app must be installable on mobile (iOS/Android) and work offline.

**Target audience:** Kids and teenagers (roughly 8–16 years old) and their parents. The product must feel **fun, fresh, and alive** — not a corporate productivity tool. See the Visual & Tone Guide section below; it is a hard requirement, not a suggestion.

**Tech stack (locked, unless explicitly justified):**

- **Framework:** Next.js 14+ with App Router and TypeScript
- **Hosting:** Vercel
- **Database + Auth:** Supabase (Postgres + Auth + Row Level Security)
- **Offline storage:** Dexie.js on IndexedDB
- **Server/client state:** TanStack Query (React Query) with persistence
- **UI local state:** Zustand (only where needed)
- **Styles:** Tailwind CSS + shadcn/ui (heavily customized — see style guide)
- **Animations:** Framer Motion (motion is part of the brand, not an extra)
- **PWA:** Serwist (`@serwist/next`) for service worker and caching
- **Push notifications:** Web Push API + Supabase Edge Functions (Deno) for delivery
- **Validation:** Zod for schemas
- **Forms:** React Hook Form + Zod resolver
- **Dates:** date-fns + date-fns-tz
- **Icons:** lucide-react (plus emoji used as first-class UI elements)
- **Internationalization:** `next-intl` with default locale `es` and full intl-ready architecture

**Constraints and principles:**

1. **Simplicity over flexibility:** Cover the 95% of use cases with simple models before supporting 100% with complexity (e.g. do not implement full iCal RRULE).
2. **Offline-first for kid reads and writes:** Kids must be able to mark tasks complete with no network.
3. **Do not pre-generate recurring task instances** in the database. Occurrences are computed on the client; only the `task_completion` row is persisted when the kid checks the task off.
4. **Strict RLS:** No data leaks between families. Every user-data table has `family_id` and a matching RLS policy.
5. **Last-write-wins** for sync conflict resolution.
6. **Mobile-first** design. The app lives on the phone.
7. **Spanish by default, intl-ready from day one.** Every user-facing string goes through the i18n layer. No hardcoded copy.

---

## 2. Objective

Deliver a working PWA, deployed to Vercel, that satisfies **every** requirement below:

1. ✅ Customizable tasks with configurable time and repetition days.
2. ✅ Customizable point rewards per task.
3. ✅ Daily and calendar views for tasks.
4. ✅ Differentiated roles: **parent** user (creates/edits/approves tasks) and **kid** user (views and completes tasks).
5. ✅ Installable on mobile (Android/iOS) as a PWA.
6. ✅ Offline behavior: read state and mark tasks complete with no network, syncing when reconnected.
7. ✅ **Push notifications as task reminders**, based on configured `due_time`.
8. ✅ Reward system: parent defines rewards with point cost; kid redeems.
9. ✅ Multi-family: the schema supports multiple isolated families with RLS.
10. ✅ Spanish UI by default, fully translatable to other locales without code changes.
11. ✅ Visual identity that feels fun and alive for kids and teenagers (see Visual & Tone Guide).

**Definition of Done:** A parent can sign up, create a kid account, assign recurring tasks with schedules, the kid can install the app on their phone, receive a push reminder at the configured time, mark the task as done (even offline), see their accumulated points, and redeem a reward. Everything in production. The app feels like something a teenager would actually want to open, not homework. UI defaults to Spanish; switching to English (or another locale) is a one-config change.

---

## 3. Visual & Tone Guide (mandatory)

This section defines the look and voice. Every UI task must respect it. The agent should reread this before building any user-facing screen.

### 3.1 Personality

- **Energetic, playful, encouraging.** The app is a sidekick, not a teacher.
- **Celebrates wins.** Completing a task should feel like a small dopamine hit — animation, sound, points popping in.
- **Never condescending.** Kids and especially teens hate being talked down to. Avoid baby talk and overly cute mascots. Aim closer to Duolingo / Habitica / BeReal in tone than to a kindergarten app.
- **Visually bold but not chaotic.** Strong color, generous whitespace, big readable type.

### 3.2 Color system

Use a vibrant palette with high contrast. Two-tone gradients are encouraged for hero elements, backgrounds, and primary CTAs.

- **Primary:** electric purple `#7C3AED` → indigo `#4F46E5` gradient
- **Accent / success:** lime `#84CC16` and emerald `#10B981`
- **Energy / warning:** amber `#F59E0B` and coral `#FB7185`
- **Surface (light):** off-white `#FAFAF9` with neutral `#F5F5F4` cards
- **Surface (dark):** near-black `#0A0A0B` with `#18181B` cards
- **Text:** `#0A0A0B` on light, `#FAFAF9` on dark; muted `#71717A`

Tailwind config must define these as named tokens (`brand`, `accent`, `energy`, etc.) so they are reused via classes, never hex-coded inline. **Dark mode is first-class**, not an afterthought — many teens default to dark.

### 3.3 Typography

- **Display / headings:** a personality-rich rounded geometric sans — `Space Grotesk` or `Cabinet Grotesk` (load via `next/font`).
- **Body:** `Inter` for readability.
- **Numbers (points, balances, streaks):** tabular figures, slightly oversized, often weighted bold to feel like a score.

### 3.4 Iconography and emoji

- Lucide for functional icons (nav, controls).
- **Emoji are intentional UI elements**, not decoration. Tasks let users pick an emoji as their icon (🦷 for brushing teeth, 📚 for homework, 🛏️ for making the bed). Emoji render with `apple-color-emoji, "Segoe UI Emoji", "Noto Color Emoji"` font stack so they look native on each platform.

### 3.5 Motion

- Framer Motion across the app. Spring transitions, not linear.
- **Completing a task** triggers: checkbox satisfying snap → points counter rolls up → confetti burst (subtle, ~600ms) → soft haptic vibration (Web Vibration API where supported) → optional small sound effect (off by default, toggle in settings).
- **Page transitions:** slide + fade for navigation, never instant cuts.
- **Loading:** branded skeletons with a slow shimmer, not generic spinners.
- Respect `prefers-reduced-motion`: disable confetti and large transitions, keep functional feedback.

### 3.6 Voice and copy

All copy is written through the i18n layer (Spanish as the source of truth for now). Tone rules:

- **Use second person** (`tú`, not `usted`). Direct and friendly.
- **Short sentences.** Big buttons say one thing: `¡Hecho!`, `Canjear`, `Empezar`.
- **Celebrate, don't praise.** `+10 puntos 🔥` beats `¡Muy bien hecho!`. Praise feels parental; celebration feels peer.
- **Streaks, levels, and milestones** use game language: `racha`, `nivel`, `desbloqueado`.
- **Empty states** have personality. Example for empty task list: `Día limpio. ¿Te animas a una tarea extra? 🚀` — never `No hay tareas`.
- **Errors** are humble and human: `Algo se trabó. Inténtalo de nuevo.` — never stack traces or codes for kids.

### 3.7 Layout patterns

- Big rounded corners (`rounded-2xl` and `rounded-3xl` are common).
- Cards with subtle gradients or soft shadows on light, faint glow on dark.
- Bottom nav with 4 items max, large tap targets, active item with color + scale animation.
- Hero numbers (points balance, streak) shown big on home screen, the way fitness apps show stats.

---

## 4. Internationalization architecture (mandatory baseline)

i18n is set up in **Phase 0**, not retrofitted. This is non-negotiable.

- **Library:** `next-intl` (App Router compatible).
- **Default locale:** `es` (Spanish). All UI is written in Spanish first.
- **Supported locales structure:** Start with `es`. The system must accept any new locale by dropping a JSON file in `messages/` — no code changes.
- **URL strategy:** locale prefix optional with default rewrite (`/` serves `es` without prefix; `/en` for English when added).
- **Routing:** all routes inside `src/app/[locale]/...`.
- **Message files:** `messages/es.json`, organized by feature namespace (`common`, `auth`, `tasks`, `rewards`, `notifications`, `onboarding`, etc.).
- **Rules for the agent:**
  - **Zero hardcoded user-facing strings.** Every label, button text, error, toast, push notification body, and email goes through `useTranslations()` (client) or `getTranslations()` (server).
  - **Dates and numbers** use `next-intl` formatters or `date-fns` with `locale` parameter — never `toLocaleString()` without explicit locale.
  - **Pluralization** uses ICU MessageFormat (`{count, plural, one {# punto} other {# puntos}}`).
  - **Push notification copy** is also localized (the recipient profile stores their `locale`; the Edge Function picks the right message).
  - **Form validation messages** (Zod) are localized via a translator function passed into schemas.

---

## 5. Task Plan

### Conventions

- Each task has: **Goal**, **Steps**, **Acceptance criteria**, **Key files**.
- The agent must run `npm run build`, `npm run lint`, and `npm run typecheck` after every code task and resolve all errors before advancing.
- After tasks touching the database, the agent must verify RLS policies with test queries.
- **Do not advance to the next task until the current one passes its acceptance criteria.**

---

### PHASE 0 — Foundations

#### Task 0.1 — Initialize Next.js project

**Goal:** A working Next.js + TypeScript + Tailwind base running locally.

**Steps:**
1. Scaffold: `npx create-next-app@latest points-economy --typescript --tailwind --app --src-dir --import-alias "@/*"`.
2. Init git, first commit.
3. `tsconfig.json` with `strict: true` and `noUncheckedIndexedAccess: true`.
4. Folder structure: `src/app/[locale]`, `src/components`, `src/lib`, `src/hooks`, `src/types`, `src/db`, `src/server`, `src/styles`, `messages`.
5. `.env.example` with placeholders for Supabase, VAPID keys, public URL, default locale.

**Acceptance criteria:**
- `npm run dev` boots on `localhost:3000` with no errors.
- `npm run build` completes with no TS warnings.
- Folder skeleton in place.

**Key files:** `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`.

---

#### Task 0.2 — Set up internationalization with next-intl

**Goal:** i18n infrastructure ready before writing any UI.

**Steps:**
1. Install `next-intl`.
2. Move all routes under `src/app/[locale]/...`.
3. Create `i18n.ts` config with supported locales (`['es']` initially), default `es`.
4. Create `middleware.ts` (or merge with existing) using `createMiddleware` from `next-intl`.
5. Create `messages/es.json` with at least `common`, `auth` namespaces seeded.
6. Wrap root layout with `NextIntlClientProvider`.
7. Add a `LocaleSwitcher` component (hidden behind a settings menu for now, since only `es` exists, but wired and functional).
8. Document in README how to add a new locale (drop a JSON, add to config).

**Acceptance criteria:**
- A test page renders a translated string from `es.json`.
- Adding a stub `messages/en.json` and visiting `/en/...` renders English without code changes.
- No hardcoded strings exist anywhere in user-facing code (enforce with an ESLint rule like `i18next/no-literal-string` configured for JSX).

**Key files:** `i18n.ts`, `middleware.ts`, `messages/es.json`, `src/components/locale-switcher.tsx`, `.eslintrc.*`.

---

#### Task 0.3 — Configure Supabase (project + clients)

**Goal:** Supabase project created and JS clients connected from Next.js.

**Steps:**
1. Use the Supabase project credentials from `.env.local` (see `.env.example` for the required keys).
2. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env.local` and `.env.example`.
3. Install `@supabase/supabase-js` and `@supabase/ssr`.
4. Create `src/lib/supabase/client.ts` (browser client) and `src/lib/supabase/server.ts` (server client with cookies).
5. Create `src/lib/supabase/middleware.ts` for session refresh; wire into the existing middleware alongside `next-intl`.

**Acceptance criteria:**
- A test page can call `supabase.auth.getUser()` without errors.
- Env vars documented in `.env.example`.

**Key files:** `src/lib/supabase/{client,server,middleware}.ts`, `middleware.ts`.

---

#### Task 0.4 — Install UI toolkit and visual foundation

**Goal:** UI toolkit + brand tokens + fonts ready, matching the style guide.

**Steps:**
1. Initialize shadcn/ui (`new-york` style, neutral base — we override colors).
2. Install components: `button, input, label, card, dialog, dropdown-menu, sonner, tabs, calendar, checkbox, select, form, badge, avatar, sheet, separator, skeleton, switch`.
3. Install: `@tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister dexie dexie-react-hooks zod react-hook-form @hookform/resolvers date-fns date-fns-tz lucide-react zustand framer-motion canvas-confetti next-themes`.
4. Configure Tailwind theme with brand tokens (`brand`, `accent`, `energy`, gradients) per the style guide.
5. Load fonts via `next/font/google`: `Space Grotesk` (display), `Inter` (body). Expose as CSS variables.
6. Set up `src/app/[locale]/providers.tsx` with `QueryClientProvider`, `ThemeProvider` (next-themes, default dark or system), `NextIntlClientProvider`.
7. Add global `<Toaster />` (sonner) styled to match brand.
8. Create base `src/styles/globals.css` with CSS variables for light/dark, smooth scroll, safe-area handling.

**Acceptance criteria:**
- Default screen renders in branded colors and fonts (no Tailwind defaults visible).
- Dark mode toggle works.
- A celebratory confetti test on a button works.
- `npm run build` is clean.

**Key files:** `tailwind.config.ts`, `src/app/[locale]/providers.tsx`, `src/styles/globals.css`, `components.json`.

---

### PHASE 1 — Data model and authentication

#### Task 1.1 — Database schema

**Goal:** All tables, types, and constraints defined.

**Steps:**
1. Create `supabase/migrations/0001_initial_schema.sql` with:
   - `families` (id uuid PK, name text, family_code text unique, created_by uuid, created_at timestamptz, timezone text default `'America/Bogota'`).
   - `profiles` (id uuid PK refs auth.users, family_id uuid FK, role text check in `('parent','child')`, display_name text, avatar_url text, emoji text, points_balance int default 0, locale text default `'es'`, created_at).
   - `tasks` (id, family_id, assigned_to uuid FK profiles, title text, description text, points int check `> 0`, emoji text, recurrence_type text check in `('once','daily','weekly','custom')`, recurrence_days int[] nullable, due_time time nullable, start_date date, end_date date nullable, requires_approval boolean default false, active boolean default true, created_by, created_at, updated_at).
   - `task_completions` (id, task_id, completed_by, completion_date date, status text check in `('pending','approved','rejected')`, points_awarded int, reviewed_by, reviewed_at, note, created_at). Unique constraint `(task_id, completion_date)`.
   - `rewards` (id, family_id, name, description, cost_points int check `> 0`, emoji, active, created_at).
   - `reward_redemptions` (id, reward_id, redeemed_by, status text check in `('pending','approved','rejected','fulfilled')`, cost_points_at_redemption, requested_at, reviewed_by, reviewed_at).
   - `push_subscriptions` (id, profile_id, endpoint text unique, p256dh text, auth text, user_agent text, created_at, last_used_at).
   - `reminder_log` (id, task_id, profile_id, sent_for_date date, sent_at) with unique `(task_id, profile_id, sent_for_date)`.
2. Indexes: `tasks(family_id, active)`, `tasks(assigned_to)`, `task_completions(task_id, completion_date)`, `task_completions(completed_by)`, `push_subscriptions(profile_id)`.
3. Apply migration.

**Acceptance criteria:**
- All tables visible in the Supabase dashboard.
- Foreign keys enforced.
- `task_completions` unique constraint prevents duplicate same-day check-ins.

**Key files:** `supabase/migrations/0001_initial_schema.sql`.

---

#### Task 1.2 — Row Level Security policies

**Goal:** Strict family isolation. No cross-family reads or writes.

**Steps:**
1. Create `supabase/migrations/0002_rls_policies.sql`.
2. Enable RLS on every table.
3. SQL helpers: `auth.user_family_id()`, `auth.user_role()`.
4. Policies for `profiles`, `families`, `tasks`, `task_completions`, `rewards`, `reward_redemptions`, `push_subscriptions`, `reminder_log` — see the rules in the original plan summary, with:
   - SELECT scoped to same family.
   - Parent-only writes for `tasks` and `rewards`.
   - Kid can INSERT a `task_completion` only for tasks assigned to themselves.
   - Owner-only writes for `push_subscriptions`.

**Acceptance criteria:**
- Two test users in different families cannot see each other's data.
- A kid cannot insert a task (RLS rejects).
- A kid cannot approve their own completion.

**Key files:** `supabase/migrations/0002_rls_policies.sql`.

---

#### Task 1.3 — TypeScript types from Supabase

**Goal:** Schema-synced types to prevent runtime drift.

**Steps:**
1. Install Supabase CLI if missing.
2. `supabase gen types typescript --project-id <id> > src/types/database.ts`.
3. Derive convenience types in `src/types/index.ts`: `Task`, `TaskCompletion`, `Profile`, `Reward`, `RewardRedemption` from `Database['public']['Tables'][...]['Row']`.
4. Add npm script: `"db:types": "supabase gen types typescript --project-id <id> > src/types/database.ts"`.

**Acceptance criteria:**
- `src/types/database.ts` exists and compiles.
- Convenience types accessible from `@/types`.

**Key files:** `src/types/database.ts`, `src/types/index.ts`.

---

#### Task 1.4 — Parent signup and login

**Goal:** A parent can register and sign in with email/password.

**Steps:**
1. Route `/[locale]/signup` with form: email, password, display_name, family_name. All copy localized.
2. Server Action `signUpParent` that:
   - Calls `supabase.auth.signUp`.
   - Creates `families` row (auto-generates 6-char `family_code`).
   - Creates `profiles` row with `role='parent'`.
   - Wrapped in a SQL function `create_family_with_parent` for atomicity.
3. Route `/[locale]/login` with email/password form.
4. `/[locale]/auth/callback` for email confirmation.
5. Logout in user menu.
6. Protect dashboard routes with redirect when no session.
7. Welcome screen post-signup uses brand tone: e.g. `¡Bienvenido, {name}! Vamos a montar el primer reto. 🚀`.

**Acceptance criteria:**
- New email registers successfully, ends up with `role='parent'` and a created family.
- Login redirects to `/[locale]/dashboard`.
- Logout clears session.
- All copy goes through the i18n layer.

**Key files:** `src/app/[locale]/(auth)/signup/page.tsx`, `src/app/[locale]/(auth)/login/page.tsx`, `src/server/actions/auth.ts`, `supabase/migrations/0003_create_family_function.sql`, `messages/es.json` (auth namespace).

---

#### Task 1.5 — Kid profile creation and login (PIN)

**Goal:** Parent creates kids; each kid signs in with family code + name + PIN.

**Steps:**
1. Parent dashboard UI: "Add kid" sheet with `display_name`, `emoji` (picker), `pin` (4–6 digits).
2. Server Action `createChild`:
   - Generates synthetic email `child-{uuid}@app.local`.
   - Calls `auth.admin.createUser` with the PIN as password (server-side using service role).
   - Creates `profile` row with `role='child'` and the chosen `emoji` as avatar identity.
3. Route `/[locale]/login/child`: form with `family_code`, then a kid picker (avatars + names), then PIN pad.
4. The kid picker visually feels like a profile selector (Netflix-style, big touch targets, animated).
5. Server Action resolves the synthetic email from `(family_code, profile_id)` and calls `signInWithPassword`.

**Acceptance criteria:**
- Parent creates kid "Juan" with emoji 🦊 and PIN `1234`.
- Kid signs in from another device with family code + selecting Juan + entering `1234`, lands on the kid dashboard.
- Wrong PIN shows a friendly localized error.

**Key files:** `src/app/[locale]/(parent)/dashboard/children/page.tsx`, `src/app/[locale]/(auth)/login/child/page.tsx`, `src/server/actions/children.ts`.

---

#### Task 1.6 — Layout and role guards

**Goal:** Separated, protected routes by role.

**Steps:**
1. Route groups `[locale]/(parent)/...` and `[locale]/(child)/...`.
2. In each group's layout, server-side check `profile.role`; redirect mismatches.
3. Client `RoleGuard` component for defense-in-depth.
4. Differentiated bottom nav:
   - Parent: `Tareas`, `Hijos`, `Recompensas`, `Aprobar`.
   - Kid: `Hoy`, `Calendario`, `Recompensas`, `Perfil`.
5. Bottom nav has bold active state with color + scale spring animation, large tap targets, safe-area inset.

**Acceptance criteria:**
- Cross-role navigation redirects properly.
- Bottom nav swaps by role.
- Visually matches the style guide (rounded, energetic active state).

**Key files:** `src/app/[locale]/(parent)/layout.tsx`, `src/app/[locale]/(child)/layout.tsx`, `src/components/role-guard.tsx`, `src/components/bottom-nav.tsx`.

---

### PHASE 2 — Core task functionality

#### Task 2.1 — Task CRUD (parent)

**Goal:** Parent can create, edit, deactivate, and delete tasks.

**Steps:**
1. Route `/[locale]/parent/tasks` with list (active/inactive tabs).
2. "New task" sheet with form:
   - Title (required, min 2)
   - Description (optional)
   - Assign to: kid picker
   - Points: number, min 1, with cute "+5 / +10 / +20" quick chips
   - Emoji picker (the icon)
   - Recurrence type: `once | daily | weekly | custom`
   - If `weekly | custom`: weekday checkboxes (L–D)
   - Due time: optional time picker
   - Start/end dates
   - Toggle `requires_approval`
3. Zod validation, localized error messages.
4. Server Actions: `createTask`, `updateTask`, `deactivateTask`, `deleteTask`.
5. Optimistic updates with TanStack Query.
6. Empty state copy: localized, on-brand (`Aún no hay retos. Crea el primero. ✨`).

**Acceptance criteria:**
- Parent creates a daily task at 8:00 AM, 5 points, assigned to a kid.
- Edit and deactivate work.
- Validation rejects invalid input with friendly localized messages.

**Key files:** `src/app/[locale]/(parent)/tasks/page.tsx`, `src/components/task-form.tsx`, `src/server/actions/tasks.ts`, `src/lib/schemas/task.ts`.

---

#### Task 2.2 — Recurrence calculation logic

**Goal:** Pure function computing which tasks apply on a given date.

**Steps:**
1. Create `src/lib/recurrence.ts`:
   - `taskOccursOn(task, date): boolean`.
   - `getTasksForDate(tasks, date): Task[]`.
   - `getTasksForDateRange(tasks, from, to): Map<string, Task[]>`.
2. Cases: `once`, `daily`, `weekly`, `custom`. Respect `start_date`, `end_date`, `active`.
3. Use family timezone — pass timezone explicitly, never call `new Date()` inside the pure function.
4. Vitest tests for every case including timezone edges.

**Acceptance criteria:**
- Test suite at 100% pass, ≥90% line coverage.
- No hidden `Date.now()` calls.

**Key files:** `src/lib/recurrence.ts`, `src/lib/recurrence.test.ts`, `vitest.config.ts`.

---

#### Task 2.3 — Kid "Today" view

**Goal:** Kid sees today's tasks and can check them off with a satisfying animation.

**Steps:**
1. Route `/[locale]/child/today`:
   - Header: greeting (`¡Hola, {nombre}!`), big animated points balance, streak badge (optional).
   - Task list grouped by time of day (mañana, tarde, noche) based on `due_time`.
   - Each item: emoji, title, points pill, time, big checkbox.
2. Checking a task triggers Server Action `completeTask(taskId, date)`:
   - Inserts `task_completions` (`approved` if not `requires_approval`, else `pending`).
   - Atomically increments `profiles.points_balance` if approved (RPC).
3. On success in the UI:
   - Checkbox snap (Framer Motion spring).
   - Points counter rolls up with animated digits.
   - Confetti burst (`canvas-confetti`).
   - Soft vibration via Web Vibration API where supported.
   - Toast: `+{n} puntos 🔥`.
4. Completed tasks show with check + points earned, visually separated.
5. Respect `prefers-reduced-motion`.

**Acceptance criteria:**
- Today's recurring tasks appear correctly.
- Completion sums points and triggers the animation chain.
- Cannot double-check (UNIQUE constraint).
- Reduced motion disables confetti but keeps check feedback.

**Key files:** `src/app/[locale]/(child)/today/page.tsx`, `src/server/actions/completions.ts`, `supabase/migrations/0004_complete_task_function.sql`, `src/components/celebrate.tsx`.

---

#### Task 2.4 — Calendar view (kid and parent)

**Goal:** Monthly and weekly calendar of tasks.

**Steps:**
1. Routes `/[locale]/child/calendar` and `/[locale]/parent/tasks/calendar`.
2. Calendar shows colored dots/badges on days with tasks.
3. Tap a day → bottom panel with that day's tasks.
4. Toggle month/week view.
5. Parent view shows kid avatar/color per task.
6. Parent can tap a day and "Add task starting this day" (shortcut to creation with `start_date` prefilled).
7. Smooth transitions between months (slide).

**Acceptance criteria:**
- Days with tasks show indicators.
- Day selection filters correctly.
- Acceptable performance with 100+ tasks (memoization).

**Key files:** `src/app/[locale]/(child)/calendar/page.tsx`, `src/app/[locale]/(parent)/tasks/calendar/page.tsx`, `src/components/task-calendar.tsx`.

---

#### Task 2.5 — Approvals (parent)

**Goal:** Parent reviews and approves/rejects pending completions.

**Steps:**
1. Route `/[locale]/parent/approvals`, list of `pending` completions.
2. Approve / reject actions; reject can include a localized note.
3. Approve increments balance; reject leaves it untouched.
4. Badge with pending count in parent bottom nav, animated when count changes.

**Acceptance criteria:**
- `requires_approval=true` tasks land in `pending`.
- Approve sums points; reject does not; both update UI immediately.

**Key files:** `src/app/[locale]/(parent)/approvals/page.tsx`, `src/server/actions/completions.ts`.

---

### PHASE 3 — Rewards

#### Task 3.1 — Reward CRUD (parent)

**Goal:** Parent maintains a redeemable rewards catalog.

**Steps:**
1. Route `/[locale]/parent/rewards` with list and new-reward sheet (name, description, cost in points, emoji, active toggle).
2. Server Actions: `createReward`, `updateReward`, `toggleRewardActive`, `deleteReward`.

**Acceptance criteria:**
- Parent creates `1 hora de videojuegos — 50 puntos`.
- It appears in the kid catalog when active.

**Key files:** `src/app/[locale]/(parent)/rewards/page.tsx`, `src/server/actions/rewards.ts`.

---

#### Task 3.2 — Reward catalog and redemption (kid)

**Goal:** Kid browses rewards and redeems them.

**Steps:**
1. Route `/[locale]/child/rewards` with cards for each active reward.
2. Card states: available (enough points) / locked (`Te faltan {n} puntos`).
3. "Redeem" button opens a confirm dialog with a satisfying animation on confirm.
4. Server Action `redeemReward(rewardId)`:
   - Validates points sufficient.
   - Inserts `reward_redemptions` with `status='pending'`.
   - Atomically deducts points (RPC).
5. "My redemptions" history section.

**Acceptance criteria:**
- Kid with 50 points can redeem a 50-point reward; balance becomes 0.
- Kid with 30 points can't redeem a 50-point reward; sees a friendly localized hint.
- Parent sees the new redemption in approvals.

**Key files:** `src/app/[locale]/(child)/rewards/page.tsx`, `src/server/actions/redemptions.ts`, `supabase/migrations/0005_redeem_reward_function.sql`.

---

#### Task 3.3 — Redemption approval (parent)

**Goal:** Parent approves and marks redemptions as fulfilled.

**Steps:**
1. Second tab in `/[locale]/parent/approvals`: pending redemptions.
2. Actions: approve (`approved`), mark fulfilled (`fulfilled`), reject (refunds points).

**Acceptance criteria:**
- Reject refunds points to kid balance.
- Fulfilled closes the loop.

**Key files:** `src/server/actions/redemptions.ts`.

---

### PHASE 4 — PWA and installability

#### Task 4.1 — Manifest and assets

**Goal:** App installable on mobile with proper icon, splash, and name.

**Steps:**
1. `public/manifest.json` with: name, short_name, description, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, `orientation: "portrait"`, icons (192, 512, maskable).
2. Generate icons (192/512/maskable + Apple touch) honoring the brand palette. Tool: `pwa-asset-generator`.
3. Apple meta tags in root layout: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`.
4. Splash screens for iOS sizes.

**Acceptance criteria:**
- Lighthouse PWA: manifest checks pass.
- Chrome mobile shows "Install app".
- iOS "Add to Home Screen" shows the right icon and splash.

**Key files:** `public/manifest.json`, `public/icons/*`, `src/app/[locale]/layout.tsx`.

---

#### Task 4.2 — Service worker with Serwist

**Goal:** Offline app shell + cache strategies.

**Steps:**
1. Install `@serwist/next serwist`.
2. `next.config.mjs` with `withSerwist`.
3. `src/app/sw.ts` with:
   - Build asset precache (default Serwist).
   - `NetworkFirst` for `/api/*` and `/_next/data/*`.
   - `StaleWhileRevalidate` for Supabase Storage images (if used).
   - `CacheFirst` for fonts and static assets.
   - Offline fallback `/[locale]/offline`.
4. `/[locale]/offline` page on-brand (illustrative emoji, retry button, localized).
5. Register SW only in production.

**Acceptance criteria:**
- DevTools shows the SW active.
- Going offline still loads the app shell with cached content.
- Lighthouse PWA audit fully green.

**Key files:** `src/app/sw.ts`, `next.config.mjs`, `src/app/[locale]/offline/page.tsx`.

---

### PHASE 5 — Real offline support

#### Task 5.1 — Dexie schema and initial sync

**Goal:** Local replica of relevant data in IndexedDB.

**Steps:**
1. `src/db/dexie.ts` with `AppDB extends Dexie`:
   - Stores: `tasks`, `task_completions`, `rewards`, `reward_redemptions`, `profiles`, `pending_mutations`, `meta`.
   - Indexes by `family_id`, `assigned_to`, `completion_date`.
2. `syncFromRemote()`:
   - On login and `online` event, fetch active tasks ±60 days, profiles, rewards, last 30 days of completions.
   - Bulk `put` into Dexie.
   - Save `last_sync_at` in `meta`.
3. Hook `useOfflineTasks(date)` using `useLiveQuery` + `getTasksForDate` from recurrence module.

**Acceptance criteria:**
- After login with network, IndexedDB contains data.
- DevTools offline + reload: "Today" still shows tasks.
- `last_sync_at` updates.

**Key files:** `src/db/dexie.ts`, `src/db/sync.ts`, `src/hooks/use-offline-tasks.ts`.

---

#### Task 5.2 — Offline mutation queue

**Goal:** Mark tasks done with no network; sync on reconnect.

**Steps:**
1. `pending_mutations` schema: `{ id, type, payload, created_at, retries, status }`.
2. `mutate()` wrapper:
   - Online: call Server Action, update Dexie.
   - Offline: write to Dexie with `pending_sync=true`, enqueue mutation.
3. Drain queue on `online` event and on app start, exponential backoff (max 5 retries).
4. Permanent failures (4xx): mark `failed`, surface a localized toast.
5. UI: "Sin conexión" banner + per-item `pending` badge.

**Acceptance criteria:**
- Offline check-off updates UI optimistically (balance + completed visual).
- Online again → mutation sent, badge clears.
- UNIQUE conflict from a duplicate same-day completion is handled gracefully.

**Key files:** `src/db/mutations.ts`, `src/hooks/use-online-status.ts`, `src/components/sync-indicator.tsx`.

---

#### Task 5.3 — Last-write-wins conflict resolution

**Goal:** Remote data overrides local on sync, except for pending mutations.

**Steps:**
1. In `syncFromRemote()`, before bulkPut compare `updated_at` and keep the newest.
2. Never overwrite rows where local copy has `pending_sync=true`.
3. Console-log conflicts for debugging.

**Acceptance criteria:**
- Editing a task on another device and re-syncing reflects the change.
- Local pending changes are preserved through sync.

**Key files:** `src/db/sync.ts`.

---

### PHASE 6 — Push notifications (reminders)

#### Task 6.1 — VAPID keys and environment

**Goal:** VAPID key pair available across environments.

**Steps:**
1. Generate: `npx web-push generate-vapid-keys`.
2. Store as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client) and `VAPID_PRIVATE_KEY` (server / Edge Functions only).
3. Document in `.env.example`.

**Acceptance criteria:**
- Vars set in Vercel and Supabase Edge Functions.

**Key files:** `.env.example`, Vercel/Supabase config.

---

#### Task 6.2 — Client subscription to Push

**Goal:** User grants permission and `PushSubscription` is stored in Supabase.

**Steps:**
1. Extend `src/app/sw.ts`:
   - `push` handler: parses payload, shows notification with title, body, icon (brand), badge, `data.url`.
   - `notificationclick` handler: focus or open the URL (deep-link to the relevant task).
2. Client `subscribeToPush()`:
   - `Notification.requestPermission()`.
   - `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
   - Server Action `saveSubscription` upserts into `push_subscriptions`.
3. `<EnableNotifications />` component with on-brand CTA, prominent for kids and optional for parents.
4. iOS: only works when installed as PWA — show a localized hint when on iOS Safari pre-install.

**Acceptance criteria:**
- Kid grants permission, row appears in `push_subscriptions`.
- Manual `web-push send-notification` test delivers correctly.
- iOS PWA receives notifications.

**Key files:** `src/app/sw.ts`, `src/lib/push.ts`, `src/components/enable-notifications.tsx`, `src/server/actions/push.ts`.

---

#### Task 6.3 — Edge Function for sending notifications

**Goal:** Reusable server-side endpoint to send push to a profile list.

**Steps:**
1. Edge Function `send-push` (Deno):
   - Input: `{ profile_ids: string[], title: string, body: string, url?: string, locale?: string }`.
   - Loads matching subscriptions.
   - Uses Deno-compatible `web-push` to deliver.
   - 410/404 responses → delete the subscription row.
2. Authenticate via service-role secret; not callable from the browser.
3. Notification payload includes brand icon, badge, and `tag` for de-duplication.

**Acceptance criteria:**
- Invoking with a valid profile delivers the push.
- Stale subs are purged.

**Key files:** `supabase/functions/send-push/index.ts`.

---

#### Task 6.4 — Reminder scheduler

**Goal:** Auto-push to kids near tasks' `due_time` for pending tasks.

**Steps:**
1. Edge Function `task-reminders` (Deno):
   - Computes the "current window" (next ~5 minutes per family timezone).
   - Query: active tasks for kids, occurring today by recurrence rules, with `due_time` in the window, and **without** a `task_completion` for `completion_date = today`.
   - For each task: insert `reminder_log` (skipping if already logged for that date), then invoke `send-push` with localized copy:
     - title: `⏰ ¡{taskTitle}!`
     - body: `Te esperan +{points} puntos`
     - locale: pulled from the recipient's `profiles.locale`.
2. Schedule with `pg_cron` every 5 minutes:
   ```sql
   select cron.schedule('task-reminders', '*/5 * * * *', $$
     select net.http_post(url := '<edge-function-url>', headers := ...);
   $$);
   ```
3. Localize push copy via a small message bundle inside the Edge Function (`messages/es.json` shape mirrored).
4. Respect `families.timezone` when matching `due_time`.

**Acceptance criteria:**
- A task at 08:00 AM fires its reminder between 08:00 and 08:05.
- No duplicates per `(task, kid, date)`.
- A task already completed today fires no reminder.
- Different timezone → reminder fires at the correct local time.
- Push body comes through in the kid's locale.

**Key files:** `supabase/functions/task-reminders/index.ts`, `supabase/functions/task-reminders/messages/*.json`, `supabase/migrations/0006_pg_cron_setup.sql`.

---

#### Task 6.5 — Parent notifications on key events

**Goal:** Parents get pushed when there's something to approve.

**Steps:**
1. SQL trigger on `task_completions` insert with `status='pending'` → invoke `send-push` to the family's parent(s).
2. SQL trigger on `reward_redemptions` insert → push to parent(s).
3. Parent setting to enable/disable each notification kind.
4. All notification copy localized using parent's `locale`.

**Acceptance criteria:**
- Pending completion → parent receives push.
- New redemption → parent receives push.
- Settings toggle disables them.

**Key files:** `supabase/migrations/0007_notification_triggers.sql`, `src/app/[locale]/(parent)/settings/page.tsx`.

---

### PHASE 7 — Polish and shipping

#### Task 7.1 — Mobile-first polish

**Goal:** Smooth, accessible, on-brand experience on phones.

**Steps:**
1. Verify every page on 375x667 (iPhone SE) and 412x915 (Pixel).
2. Tap targets ≥ 44x44.
3. Sticky bottom nav with `env(safe-area-inset-bottom)`.
4. Branded skeleton loaders.
5. Personality empty states everywhere (localized).
6. Dark mode parity.
7. Page transitions with Framer Motion.
8. Vibration + optional sound on completion (toggle in kid settings, default off for sound).
9. Accessibility pass: focus rings, aria labels, prefers-reduced-motion respected.

**Acceptance criteria:**
- Lighthouse Mobile: Performance > 85, Accessibility > 95, Best Practices > 95, SEO > 90, PWA pass.
- No clipped UI in notch / safe areas.
- Dark mode matches the spec.

**Key files:** `src/app/[locale]/globals.css`, multiple components.

---

#### Task 7.2 — Onboarding

**Goal:** New parent goes from signup to first reminder in under 5 minutes.

**Steps:**
1. Post-signup wizard (3 steps): create first kid → create first task → enable notifications. Animated transitions, hype copy.
2. Coachmark on how to share `family_code`.
3. Card "Cómo instalar la app" with iOS / Android specific instructions and screenshots.
4. Suggested-task chips ("Lavarse los dientes 🦷", "Tender la cama 🛏️", "Tarea escolar 📚") to seed quickly.

**Acceptance criteria:**
- New users complete onboarding without external help.
- Suggestion chips visibly speed up first task creation.

**Key files:** `src/app/[locale]/(parent)/onboarding/*`.

---

#### Task 7.3 — E2E tests

**Goal:** Critical flows protected against regression.

**Steps:**
1. Configure Playwright.
2. Tests:
   - Parent signup → kid creation → recurring task creation.
   - Kid login → see today → complete task → points add up.
   - Reward redemption flow.
   - Offline: complete a task offline, reconnect, verify sync.
3. Run against Vercel preview deployments in CI.

**Acceptance criteria:**
- Playwright suite passes in CI.

**Key files:** `e2e/*.spec.ts`, `playwright.config.ts`, `.github/workflows/e2e.yml`.

---

#### Task 7.4 — Vercel deploy and production config

**Goal:** Live app with HTTPS domain.

**Steps:**
1. Connect repo to Vercel.
2. Set env vars (Supabase URL/keys, public VAPID, default locale).
3. Custom domain with HTTPS (required for PWA + Push).
4. Add the domain to Supabase Site URL and Redirect URLs.
5. Enable Vercel Analytics + Speed Insights.

**Acceptance criteria:**
- Public HTTPS domain reachable.
- Login works in production.
- PWA installable from the public domain.
- Push notifications deliver in production.

**Key files:** `vercel.json` (if needed), Vercel dashboard config.

---

#### Task 7.5 — Monitoring

**Goal:** Detect production errors fast.

**Steps:**
1. Sentry (free tier) integrated for Next.js (client + server + edge).
2. Capture errors from Server Actions, Edge Functions, and client.
3. Structured logging in Edge Functions with levels.
4. Lightweight metrics dashboard: tasks completed/day, push sent, error rates.

**Acceptance criteria:**
- A test error in production appears in Sentry.
- Push and reminder Edge Functions emit logs.

**Key files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.

---

#### Task 7.6 — Documentation

**Goal:** Any dev (or future you) can understand, run, and ship the project.

**Steps:**
1. `README.md`: overview, stack, requirements, local setup, env vars, commands, deploy.
2. `docs/architecture.md`: online/offline data-flow diagram.
3. `docs/database.md`: tables and RLS policies overview.
4. `docs/push-notifications.md`: subscription + scheduler flow.
5. `docs/i18n.md`: how to add a new locale (drop a JSON, register, deploy).
6. `docs/style-guide.md`: a developer-facing version of Section 3 with do's and don'ts and component examples.

**Acceptance criteria:**
- A new dev can run the app locally in < 30 minutes following the README.

**Key files:** `README.md`, `docs/*`.

---

## 6. Final compliance checklist

Before declaring the project done, the agent verifies each:

- [ ] **Req 1:** Tasks with time and repetition days → Tasks 2.1, 2.2.
- [ ] **Req 2:** Customizable points per task → Task 2.1.
- [ ] **Req 3:** Daily and calendar views → Tasks 2.3, 2.4.
- [ ] **Req 4:** Differentiated parent/kid roles → Tasks 1.4, 1.5, 1.6.
- [ ] **Req 5:** Installable as PWA → Tasks 4.1, 4.2.
- [ ] **Req 6:** Offline support → Tasks 5.1, 5.2, 5.3.
- [ ] **Req 7:** Push reminders → Tasks 6.1–6.5.
- [ ] **Req 8:** Rewards system → Tasks 3.1, 3.2, 3.3.
- [ ] **Req 9:** Multi-family with RLS → Tasks 1.1, 1.2.
- [ ] **Req 10:** Spanish UI by default, intl-ready → Tasks 0.2, 7.6.
- [ ] **Req 11:** Fresh, alive visual identity for kids/teens → Section 3, applied across Phases 0–7.
- [ ] **Stack:** Next.js + Supabase + Vercel → Tasks 0.1, 0.3, 7.4.
- [ ] **Production deployment** → Task 7.4.
- [ ] **E2E tests passing** → Task 7.3.

---

## 7. Notes for the executing agent

1. Use claude skills and mcps available.
2. **Never skip RLS:** when you add a table, write its policies in the same or next migration.
3. **Don't invent APIs:** for Supabase, Web Push, or `next-intl`, consult official docs before implementing. Verify method names and parameters.
4. **Optimistic updates need rollback:** every optimistic mutation must roll back on error.
5. **Server Actions vs Route Handlers:** prefer Server Actions for normal flow mutations; use Route Handlers only when an external client (e.g. an Edge Function) must invoke them.
6. **Timezones:** store timestamps in UTC; convert to local only on the client. `date` (not timestamp) columns are interpreted as local dates against `families.timezone`.
7. **i18n discipline:** zero hardcoded user-facing strings. If you need a string, add a key to `messages/es.json` first.
8. **Style discipline:** if a screen looks like generic Tailwind defaults, you didn't follow Section 3. Re-apply tokens, motion, and tone before considering the task done.
9. **If blocked:** stop, document the blocker, and ask for clarification rather than improvising.
