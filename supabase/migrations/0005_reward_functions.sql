-- redeem_reward: atomically validates points, inserts redemption, deducts points
create or replace function public.redeem_reward(
  p_reward_id  uuid,
  p_redeemed_by uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward        rewards%rowtype;
  v_balance       int;
  v_redemption_id uuid;
  v_status        text;
begin
  -- Lock and fetch reward
  select * into v_reward from rewards where id = p_reward_id for share;
  if not found then
    raise exception 'Reward not found';
  end if;
  if not v_reward.active then
    raise exception 'Reward is not active';
  end if;

  -- Check points balance
  select points_balance into v_balance from profiles where id = p_redeemed_by for update;
  if v_balance < v_reward.cost_points then
    raise exception 'Not enough points';
  end if;

  -- Deduct points immediately (no approval required for redemption deduction)
  update profiles set points_balance = points_balance - v_reward.cost_points where id = p_redeemed_by;

  -- Insert redemption with pending status
  v_status := 'pending';
  insert into reward_redemptions (reward_id, redeemed_by, cost_points_at_redemption, status)
  values (p_reward_id, p_redeemed_by, v_reward.cost_points, v_status)
  returning id into v_redemption_id;

  return json_build_object(
    'redemption_id', v_redemption_id,
    'cost_points', v_reward.cost_points,
    'status', v_status
  );
end;
$$;

-- approve_redemption: marks fulfilled
create or replace function public.approve_redemption(
  p_redemption_id uuid,
  p_reviewer_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update reward_redemptions
  set status = 'fulfilled', reviewed_by = p_reviewer_id, reviewed_at = now()
  where id = p_redemption_id and status = 'pending';

  if not found then
    raise exception 'Redemption not found or already reviewed';
  end if;
end;
$$;

-- reject_redemption: refunds points to child
create or replace function public.reject_redemption(
  p_redemption_id uuid,
  p_reviewer_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption reward_redemptions%rowtype;
begin
  select * into v_redemption from reward_redemptions
  where id = p_redemption_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Redemption not found or already reviewed';
  end if;

  -- Refund points
  update profiles
  set points_balance = points_balance + v_redemption.cost_points_at_redemption
  where id = v_redemption.redeemed_by;

  -- Mark rejected
  update reward_redemptions
  set status = 'rejected', reviewed_by = p_reviewer_id, reviewed_at = now()
  where id = p_redemption_id;
end;
$$;
