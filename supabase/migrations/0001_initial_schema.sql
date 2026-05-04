-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_initial_schema.sql
-- Core tables for the family points economy app.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── families ──────────────────────────────────────────────────────────────────
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  family_code text not null unique,
  created_by  uuid references auth.users(id) on delete set null,
  timezone    text not null default 'America/Bogota',
  created_at  timestamptz not null default now()
);

-- ── profiles ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  family_id      uuid not null references public.families(id) on delete cascade,
  role           text not null check (role in ('parent', 'child')),
  display_name   text not null,
  avatar_url     text,
  emoji          text,
  points_balance integer not null default 0 check (points_balance >= 0),
  locale         text not null default 'es',
  created_at     timestamptz not null default now()
);

-- ── tasks ─────────────────────────────────────────────────────────────────────
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references public.families(id) on delete cascade,
  assigned_to       uuid not null references public.profiles(id) on delete cascade,
  created_by        uuid not null references public.profiles(id) on delete cascade,
  title             text not null check (char_length(title) >= 2),
  description       text,
  points            integer not null check (points > 0),
  emoji             text,
  recurrence_type   text not null check (recurrence_type in ('once', 'daily', 'weekly', 'custom')),
  recurrence_days   integer[], -- 0=Sun … 6=Sat; used for 'weekly' and 'custom'
  due_time          time,
  start_date        date not null,
  end_date          date,
  requires_approval boolean not null default false,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── task_completions ──────────────────────────────────────────────────────────
create table public.task_completions (
  id                uuid primary key default gen_random_uuid(),
  task_id           uuid not null references public.tasks(id) on delete cascade,
  completed_by      uuid not null references public.profiles(id) on delete cascade,
  completion_date   date not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  points_awarded    integer check (points_awarded >= 0),
  reviewed_by       uuid references public.profiles(id) on delete set null,
  reviewed_at       timestamptz,
  note              text,
  created_at        timestamptz not null default now(),
  -- A kid can only complete each task once per day
  unique (task_id, completion_date)
);

-- ── rewards ───────────────────────────────────────────────────────────────────
create table public.rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  name        text not null,
  description text,
  cost_points integer not null check (cost_points > 0),
  emoji       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── reward_redemptions ────────────────────────────────────────────────────────
create table public.reward_redemptions (
  id                        uuid primary key default gen_random_uuid(),
  reward_id                 uuid not null references public.rewards(id) on delete cascade,
  redeemed_by               uuid not null references public.profiles(id) on delete cascade,
  status                    text not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected', 'fulfilled')),
  cost_points_at_redemption integer not null check (cost_points_at_redemption > 0),
  requested_at              timestamptz not null default now(),
  reviewed_by               uuid references public.profiles(id) on delete set null,
  reviewed_at               timestamptz
);

-- ── push_subscriptions ────────────────────────────────────────────────────────
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- ── reminder_log ──────────────────────────────────────────────────────────────
create table public.reminder_log (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references public.tasks(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  sent_for_date  date not null,
  sent_at        timestamptz not null default now(),
  unique (task_id, profile_id, sent_for_date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index tasks_family_active_idx     on public.tasks(family_id, active);
create index tasks_assigned_to_idx       on public.tasks(assigned_to);
create index completions_task_date_idx   on public.task_completions(task_id, completion_date);
create index completions_completed_by_idx on public.task_completions(completed_by);
create index push_subs_profile_idx       on public.push_subscriptions(profile_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger for tasks
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
