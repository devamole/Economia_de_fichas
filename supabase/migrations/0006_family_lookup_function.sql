-- ─────────────────────────────────────────────────────────────────────────────
-- 0006_family_lookup_function.sql
-- Public lookup of family data by code, used during child sign-in before auth.
-- SECURITY DEFINER bypasses RLS for this narrow, read-only operation so the
-- service role key is not needed in application code.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.lookup_family_by_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  select json_build_object(
    'id',       f.id,
    'name',     f.name,
    'profiles', (
      select json_agg(
        json_build_object(
          'id',           p.id,
          'display_name', p.display_name,
          'emoji',        p.emoji,
          'role',         p.role
        )
      )
      from public.profiles p
      where p.family_id = f.id
    )
  )
  into v_result
  from public.families f
  where f.family_code = upper(p_code);

  return v_result;
end;
$$;

grant execute on function public.lookup_family_by_code(text) to anon, authenticated;
