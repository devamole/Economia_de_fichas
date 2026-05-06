-- ─────────────────────────────────────────────────────────────────────────────
-- 0006_optimistic_points.sql
-- Optimistic points: award points immediately on completion even when the task
-- requires parent approval. If the parent later rejects the completion, the
-- previously-awarded points are subtracted (rollback).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── complete_task: always awards points, pending status preserved for approval ─

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

  -- Always award points immediately (optimistic). Tasks that require approval
  -- stay in "pending" status so the parent can still approve/reject, but the
  -- child receives the points right away.
  v_points := v_task.points;
  if v_task.requires_approval then
    v_status := 'pending';
  else
    v_status := 'approved';
  end if;

  insert into public.task_completions
    (task_id, completed_by, completion_date, status, points_awarded)
  values
    (p_task_id, p_completed_by, p_completion_date, v_status, v_points)
  returning id into v_completion_id;

  update public.profiles
  set points_balance = points_balance + v_points
  where id = p_completed_by;

  return jsonb_build_object(
    'completion_id', v_completion_id,
    'points_awarded', v_points,
    'status', v_status
  );
end;
$$;

-- ── approve_completion: points already awarded; only update status ────────────

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
begin
  select * into v_comp from public.task_completions where id = p_completion_id for update;
  if not found or v_comp.status != 'pending' then
    raise exception 'Completion not found or not pending';
  end if;

  update public.task_completions
  set status      = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  where id = p_completion_id;
  -- Points were already awarded by complete_task; no balance change needed.
end;
$$;

-- ── reject_completion: subtract the optimistically-awarded points ─────────────

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

  -- Rollback: subtract the points that were awarded optimistically.
  if v_comp.points_awarded is not null then
    update public.profiles
    set points_balance = points_balance - v_comp.points_awarded
    where id = v_comp.completed_by;
  end if;
end;
$$;
