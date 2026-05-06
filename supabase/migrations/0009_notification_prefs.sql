-- ─────────────────────────────────────────────────────────────────────────────
-- 0009_notification_prefs.sql
-- Adds per-parent notification preferences and the helper function used by
-- the task-reminders Edge Function.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── notification_prefs column on profiles ────────────────────────────────────

alter table public.profiles
  add column if not exists notification_prefs jsonb not null
    default '{"task_completions": true, "reward_redemptions": true}'::jsonb;

-- ── get_tasks_due_for_reminder() ─────────────────────────────────────────────
-- Returns one row per (task, kid) that:
--   • has a due_time in the next 5-minute window (in the family timezone)
--   • occurs today according to its recurrence rule
--   • has NOT been completed today
--   • has NOT been reminded yet today
-- Called exclusively from the task-reminders Edge Function (service role).

create or replace function public.get_tasks_due_for_reminder()
returns table (
  task_id    uuid,
  profile_id uuid,
  title      text,
  emoji      text,
  points     integer,
  locale     text
)
language sql
security definer
set search_path = public
as $$
  with
    now_utc as (select now() as ts),
    families_local as (
      select
        f.id                                                         as family_id,
        (n.ts at time zone f.timezone)::time                        as local_time,
        ((n.ts + interval '5 minutes') at time zone f.timezone)::time as local_time_end,
        (n.ts at time zone f.timezone)::date                        as local_date,
        extract(dow from (n.ts at time zone f.timezone))::int       as local_dow
      from public.families f, now_utc n
    )
  select
    t.id            as task_id,
    p.id            as profile_id,
    t.title,
    t.emoji,
    t.points,
    p.locale
  from public.tasks t
  join public.profiles p  on p.id = t.assigned_to
  join families_local fl  on fl.family_id = t.family_id
  where
    p.role = 'child'
    and t.active = true
    and t.due_time is not null
    -- within the current 5-minute window
    and t.due_time >= fl.local_time
    and t.due_time <  fl.local_time_end
    -- task is active on local_date
    and t.start_date <= fl.local_date
    and (t.end_date is null or t.end_date >= fl.local_date)
    -- recurrence matches today
    and (
      t.recurrence_type = 'daily'
      or (t.recurrence_type = 'once'   and t.start_date = fl.local_date)
      or (t.recurrence_type in ('weekly', 'custom')
          and fl.local_dow = any(t.recurrence_days))
    )
    -- not completed today
    and not exists (
      select 1 from public.task_completions tc
      where tc.task_id        = t.id
        and tc.completed_by   = p.id
        and tc.completion_date = fl.local_date
    )
    -- not already reminded today
    and not exists (
      select 1 from public.reminder_log rl
      where rl.task_id      = t.id
        and rl.profile_id   = p.id
        and rl.sent_for_date = fl.local_date
    );
$$;
