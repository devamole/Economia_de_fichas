-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_rls_policies.sql
-- Row Level Security: strict family isolation.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns the family_id of the currently authenticated user.
create or replace function auth.user_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

-- Returns the role ('parent' | 'child') of the currently authenticated user.
create or replace function auth.user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Enable RLS on all tables ───────────────────────────────────────────────────

alter table public.families            enable row level security;
alter table public.profiles            enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_completions    enable row level security;
alter table public.rewards             enable row level security;
alter table public.reward_redemptions  enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.reminder_log        enable row level security;

-- ── families ──────────────────────────────────────────────────────────────────

-- Members can read their own family.
create policy "families_select_own"
  on public.families for select
  using (id = auth.user_family_id());

-- Only parents can update family details.
create policy "families_update_parent"
  on public.families for update
  using (id = auth.user_family_id() and auth.user_role() = 'parent')
  with check (id = auth.user_family_id() and auth.user_role() = 'parent');

-- ── profiles ──────────────────────────────────────────────────────────────────

-- Members can read profiles in their family.
create policy "profiles_select_family"
  on public.profiles for select
  using (family_id = auth.user_family_id());

-- Users can update their own profile.
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Parents can insert child profiles (handled via service-role in server action).
-- INSERT is done server-side with service-role — no public INSERT policy needed.

-- ── tasks ─────────────────────────────────────────────────────────────────────

-- Family members can read tasks in their family.
create policy "tasks_select_family"
  on public.tasks for select
  using (family_id = auth.user_family_id());

-- Only parents can create tasks.
create policy "tasks_insert_parent"
  on public.tasks for insert
  with check (
    family_id = auth.user_family_id()
    and auth.user_role() = 'parent'
  );

-- Only parents can update tasks.
create policy "tasks_update_parent"
  on public.tasks for update
  using (family_id = auth.user_family_id() and auth.user_role() = 'parent')
  with check (family_id = auth.user_family_id() and auth.user_role() = 'parent');

-- Only parents can delete tasks.
create policy "tasks_delete_parent"
  on public.tasks for delete
  using (family_id = auth.user_family_id() and auth.user_role() = 'parent');

-- ── task_completions ──────────────────────────────────────────────────────────

-- Family members can read completions (parent sees all; kid sees their own).
create policy "completions_select_family"
  on public.task_completions for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.family_id = auth.user_family_id()
    )
  );

-- A kid can mark a task as complete only if that task is assigned to them.
create policy "completions_insert_assigned_kid"
  on public.task_completions for insert
  with check (
    completed_by = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.assigned_to = auth.uid()
        and t.active = true
    )
  );

-- Only parents can approve / reject (update status, reviewed_by, etc.).
create policy "completions_update_parent"
  on public.task_completions for update
  using (
    auth.user_role() = 'parent'
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.family_id = auth.user_family_id()
    )
  )
  with check (
    auth.user_role() = 'parent'
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.family_id = auth.user_family_id()
    )
  );

-- ── rewards ───────────────────────────────────────────────────────────────────

create policy "rewards_select_family"
  on public.rewards for select
  using (family_id = auth.user_family_id());

create policy "rewards_insert_parent"
  on public.rewards for insert
  with check (family_id = auth.user_family_id() and auth.user_role() = 'parent');

create policy "rewards_update_parent"
  on public.rewards for update
  using (family_id = auth.user_family_id() and auth.user_role() = 'parent')
  with check (family_id = auth.user_family_id() and auth.user_role() = 'parent');

create policy "rewards_delete_parent"
  on public.rewards for delete
  using (family_id = auth.user_family_id() and auth.user_role() = 'parent');

-- ── reward_redemptions ────────────────────────────────────────────────────────

-- Family members can read redemptions in their family.
create policy "redemptions_select_family"
  on public.reward_redemptions for select
  using (
    exists (
      select 1 from public.rewards r
        join public.profiles p on p.id = auth.uid()
      where r.id = reward_id
        and r.family_id = p.family_id
    )
  );

-- Kids (and parents) can request a redemption for themselves.
create policy "redemptions_insert_self"
  on public.reward_redemptions for insert
  with check (
    redeemed_by = auth.uid()
    and exists (
      select 1 from public.rewards r
      where r.id = reward_id
        and r.family_id = auth.user_family_id()
        and r.active = true
    )
  );

-- Parents can update (approve/reject/fulfill) redemptions in their family.
create policy "redemptions_update_parent"
  on public.reward_redemptions for update
  using (
    auth.user_role() = 'parent'
    and exists (
      select 1 from public.rewards r
      where r.id = reward_id
        and r.family_id = auth.user_family_id()
    )
  )
  with check (
    auth.user_role() = 'parent'
    and exists (
      select 1 from public.rewards r
      where r.id = reward_id
        and r.family_id = auth.user_family_id()
    )
  );

-- ── push_subscriptions ────────────────────────────────────────────────────────

-- Users can only see their own subscriptions.
create policy "push_subs_select_own"
  on public.push_subscriptions for select
  using (profile_id = auth.uid());

create policy "push_subs_insert_own"
  on public.push_subscriptions for insert
  with check (profile_id = auth.uid());

create policy "push_subs_update_own"
  on public.push_subscriptions for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "push_subs_delete_own"
  on public.push_subscriptions for delete
  using (profile_id = auth.uid());

-- ── reminder_log ──────────────────────────────────────────────────────────────

-- Readable by the profile it concerns or by their parent.
create policy "reminder_log_select_family"
  on public.reminder_log for select
  using (
    profile_id = auth.uid()
    or (
      auth.user_role() = 'parent'
      and exists (
        select 1 from public.profiles p
        where p.id = profile_id
          and p.family_id = auth.user_family_id()
      )
    )
  );

-- Insertions are done by Edge Functions using service-role — no public INSERT policy.
