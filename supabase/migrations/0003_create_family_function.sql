-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_create_family_function.sql
-- Atomic function: creates a family and the parent profile in one transaction.
-- Called from a Server Action with the service-role client.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_family_with_parent(
  p_user_id     uuid,
  p_family_name text,
  p_display_name text,
  p_locale      text default 'es'
)
returns uuid          -- returns the new family id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id  uuid;
  v_code       text;
  v_attempts   int := 0;
begin
  -- Generate a unique 6-char alphanumeric family code (uppercase).
  loop
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    exit when not exists (select 1 from public.families where family_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate a unique family code';
    end if;
  end loop;

  insert into public.families (name, family_code, created_by)
  values (p_family_name, v_code, p_user_id)
  returning id into v_family_id;

  insert into public.profiles (id, family_id, role, display_name, locale)
  values (p_user_id, v_family_id, 'parent', p_display_name, p_locale);

  return v_family_id;
end;
$$;
