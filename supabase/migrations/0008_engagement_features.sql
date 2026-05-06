-- ─────────────────────────────────────────────────────────────────────────────
-- 0007_engagement_features.sql
-- Adds: random boost system, daily streaks with shield, lifetime points,
-- user achievements table, and an updated complete_task function.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New columns on profiles ───────────────────────────────────────────────────

alter table public.profiles
  add column if not exists current_streak        integer not null default 0,
  add column if not exists longest_streak        integer not null default 0,
  add column if not exists last_activity_date    date,
  add column if not exists streak_shield_used_at date,
  add column if not exists total_points_earned   integer not null default 0;

-- ── New column on task_completions ────────────────────────────────────────────

alter table public.task_completions
  add column if not exists boost_type text
    check (boost_type in ('none', 'minor', 'epic'))
    default 'none';

-- ── user_achievements table ───────────────────────────────────────────────────

create table if not exists public.user_achievements (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  badge_key   text        not null,
  unlocked_at timestamptz not null default now(),
  unique (profile_id, badge_key)
);

create index if not exists user_achievements_profile_idx
  on public.user_achievements (profile_id);

alter table public.user_achievements enable row level security;

-- Any authenticated family member can read achievements of family members.
-- Only security-definer functions can insert (client inserts are blocked).
create policy "achievements_select_family"
  on public.user_achievements for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and p.family_id = public.current_user_family_id()
    )
  );

-- ── complete_task: boost-aware version ────────────────────────────────────────

create or replace function public.complete_task(
  p_task_id         uuid,
  p_completed_by    uuid,
  p_completion_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task              public.tasks%rowtype;
  v_completion_id     uuid;
  v_status            text;
  v_base_points       int;
  v_boost_points      int  := 0;
  v_boost_type        text := 'none';
  v_points            int;
  v_roll              int;
  v_current_streak    int;
  v_longest_streak    int;
  v_last_date         date;
  v_shield_used       date;
  v_new_streak        int;
  v_shield_activated  bool := false;
  v_new_achievements  text[] := '{}';
  v_total_completions bigint;
  v_epic_count        bigint;
begin
  select * into v_task from public.tasks where id = p_task_id for share;
  if not found then raise exception 'Task not found'; end if;
  if v_task.assigned_to != p_completed_by then raise exception 'Task not assigned to this user'; end if;
  if not v_task.active then raise exception 'Task is not active'; end if;

  -- ── Boost dice roll ──────────────────────────────────────────────────────────
  v_roll := floor(random() * 100)::int + 1; -- 1–100
  if v_roll <= 5 then
    v_boost_type   := 'epic';
    v_boost_points := 100;
  elsif v_roll <= 20 then
    v_boost_type   := 'minor';
    v_boost_points := 25;
  end if;

  v_base_points := v_task.points;
  v_points      := v_base_points + v_boost_points;

  if v_task.requires_approval then
    v_status := 'pending';
  else
    v_status := 'approved';
  end if;

  -- ── Insert completion ────────────────────────────────────────────────────────
  insert into public.task_completions
    (task_id, completed_by, completion_date, status, points_awarded, boost_type)
  values
    (p_task_id, p_completed_by, p_completion_date, v_status, v_points, v_boost_type)
  returning id into v_completion_id;

  -- ── Streak calculation ───────────────────────────────────────────────────────
  select current_streak, longest_streak, last_activity_date, streak_shield_used_at
  into v_current_streak, v_longest_streak, v_last_date, v_shield_used
  from public.profiles
  where id = p_completed_by
  for update;

  if v_last_date is null then
    v_new_streak := 1;
  elsif v_last_date = p_completion_date then
    -- Same day: multiple completions don't extend streak
    v_new_streak := v_current_streak;
  elsif v_last_date = p_completion_date - 1 then
    v_new_streak := v_current_streak + 1;
  elsif v_last_date = p_completion_date - 2
    and (v_shield_used is null or (p_completion_date - v_shield_used) >= 30)
  then
    -- Missed exactly 1 day and shield is available: auto-activate
    v_new_streak       := v_current_streak + 1;
    v_shield_activated := true;
  else
    v_new_streak := 1;
  end if;

  -- ── Update profile ───────────────────────────────────────────────────────────
  update public.profiles
  set points_balance        = points_balance + v_points,
      total_points_earned   = total_points_earned + v_points,
      current_streak        = v_new_streak,
      longest_streak        = greatest(longest_streak, v_new_streak),
      last_activity_date    = p_completion_date,
      streak_shield_used_at = case when v_shield_activated then p_completion_date
                                   else streak_shield_used_at end
  where id = p_completed_by;

  -- ── Achievement checks (insert … on conflict do nothing) ─────────────────────

  -- first_task: this is their very first completion
  select count(*) into v_total_completions
  from public.task_completions
  where completed_by = p_completed_by;

  if v_total_completions = 1 then
    insert into public.user_achievements (profile_id, badge_key)
    values (p_completed_by, 'first_task')
    on conflict do nothing;
    if found then
      v_new_achievements := array_append(v_new_achievements, 'first_task');
    end if;
  end if;

  -- streak milestones
  if v_new_streak >= 3 then
    insert into public.user_achievements (profile_id, badge_key)
    values (p_completed_by, 'streak_3')
    on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_3'); end if;
  end if;

  if v_new_streak >= 7 then
    insert into public.user_achievements (profile_id, badge_key)
    values (p_completed_by, 'streak_7')
    on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_7'); end if;
  end if;

  if v_new_streak >= 30 then
    insert into public.user_achievements (profile_id, badge_key)
    values (p_completed_by, 'streak_30')
    on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'streak_30'); end if;
  end if;

  -- first epic boost
  if v_boost_type = 'epic' then
    insert into public.user_achievements (profile_id, badge_key)
    values (p_completed_by, 'first_epic')
    on conflict do nothing;
    if found then v_new_achievements := array_append(v_new_achievements, 'first_epic'); end if;
  end if;

  -- king_of_boost: 5 epic boosts accumulated
  if v_boost_type = 'epic' then
    select count(*) into v_epic_count
    from public.task_completions
    where completed_by = p_completed_by and boost_type = 'epic';

    if v_epic_count >= 5 then
      insert into public.user_achievements (profile_id, badge_key)
      values (p_completed_by, 'king_of_boost')
      on conflict do nothing;
      if found then v_new_achievements := array_append(v_new_achievements, 'king_of_boost'); end if;
    end if;
  end if;

  return jsonb_build_object(
    'completion_id',    v_completion_id,
    'points_awarded',   v_points,
    'base_points',      v_base_points,
    'boost_type',       v_boost_type,
    'boost_points',     v_boost_points,
    'status',           v_status,
    'new_streak',       v_new_streak,
    'shield_activated', v_shield_activated,
    'new_achievements', to_jsonb(v_new_achievements)
  );
end;
$$;

-- ── reject_completion: also rolls back total_points_earned ────────────────────

create or replace function public.reject_completion(
  p_completion_id uuid,
  p_reviewer_id   uuid,
  p_note          text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comp public.task_completions%rowtype;
begin
  select * into v_comp from public.task_completions where id = p_completion_id for update;

  if not found or v_comp.status != 'pending' then
    raise exception 'Completion not found or not pending';
  end if;

  update public.task_completions
  set status      = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      note        = p_note
  where id = p_completion_id;

  if v_comp.points_awarded is not null then
    update public.profiles
    set points_balance      = points_balance      - v_comp.points_awarded,
        total_points_earned = greatest(0, total_points_earned - v_comp.points_awarded)
    where id = v_comp.completed_by;
  end if;
end;
$$;

-- ── activate_streak_shield: manual "día libre" ────────────────────────────────

create or replace function public.activate_streak_shield(
  p_profile_id uuid,
  p_date       date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shield_used date;
begin
  if p_profile_id != auth.uid() then
    raise exception 'Unauthorized';
  end if;

  select streak_shield_used_at
  into v_shield_used
  from public.profiles
  where id = p_profile_id
  for update;

  if v_shield_used is not null and (p_date - v_shield_used) < 30 then
    return jsonb_build_object('ok', false, 'error', 'Shield not available yet');
  end if;

  update public.profiles
  set streak_shield_used_at = p_date
  where id = p_profile_id;

  return jsonb_build_object('ok', true);
end;
$$;
