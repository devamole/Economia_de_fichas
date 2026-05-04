-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_complete_task_function.sql
-- Atomic task completion: inserts task_completion and increments points_balance
-- in one transaction to prevent race conditions.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.complete_task(
  p_task_id        uuid,
  p_completed_by   uuid,
  p_completion_date date
)
returns jsonb          -- { completion_id, points_awarded, status }
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task            public.tasks%rowtype;
  v_completion_id   uuid;
  v_status          text;
  v_points          int;
begin
  -- Fetch and lock the task row.
  select * into v_task from public.tasks where id = p_task_id for share;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.assigned_to != p_completed_by then
    raise exception 'Task not assigned to this user';
  end if;

  if not v_task.active then
    raise exception 'Task is not active';
  end if;

  -- Determine status and whether to award points immediately.
  if v_task.requires_approval then
    v_status := 'pending';
    v_points  := null;
  else
    v_status := 'approved';
    v_points  := v_task.points;
  end if;

  -- Insert the completion (unique constraint prevents double-check).
  insert into public.task_completions
    (task_id, completed_by, completion_date, status, points_awarded)
  values
    (p_task_id, p_completed_by, p_completion_date, v_status, v_points)
  returning id into v_completion_id;

  -- Award points immediately if auto-approved.
  if v_status = 'approved' then
    update public.profiles
    set points_balance = points_balance + v_task.points
    where id = p_completed_by;
  end if;

  return jsonb_build_object(
    'completion_id', v_completion_id,
    'points_awarded', v_points,
    'status', v_status
  );
end;
$$;

-- ── approve_completion: parent approves a pending completion ─────────────────

create or replace function public.approve_completion(
  p_completion_id uuid,
  p_reviewer_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comp public.task_completions%rowtype;
  v_task public.tasks%rowtype;
begin
  select * into v_comp from public.task_completions where id = p_completion_id for update;
  if not found or v_comp.status != 'pending' then
    raise exception 'Completion not found or not pending';
  end if;

  select * into v_task from public.tasks where id = v_comp.task_id;

  update public.task_completions
  set status = 'approved',
      points_awarded = v_task.points,
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  where id = p_completion_id;

  update public.profiles
  set points_balance = points_balance + v_task.points
  where id = v_comp.completed_by;
end;
$$;

-- ── reject_completion ────────────────────────────────────────────────────────

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
begin
  update public.task_completions
  set status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      note = p_note
  where id = p_completion_id and status = 'pending';

  if not found then
    raise exception 'Completion not found or not pending';
  end if;
end;
$$;
