-- ============================================================================
-- ClassTrack · 0005 Harden profile provisioning and active-account checks
-- ============================================================================

create or replace function public.current_institution_id()
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.institution_id
  from public.profiles p
  where p.id = auth.uid()
    and p.deleted_at is null
    and p.status = 'active'
$$;

create or replace function public.current_app_role()
returns public.user_role
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.deleted_at is null
    and p.status = 'active'
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.role() = 'service_role'
      or session_user in ('postgres', 'supabase_admin')
      or coalesce((
        select p.role = 'admin'
        from public.profiles p
        where p.id = auth.uid()
          and p.deleted_at is null
          and p.status = 'active'
      ), false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inst uuid;
  v_role public.user_role;
  v_first text;
  v_last text;
begin
  v_inst := nullif(new.raw_app_meta_data ->> 'institution_id', '')::uuid;

  if v_inst is null then
    select i.id into v_inst
    from public.institutions i
    where i.deleted_at is null
    order by i.created_at, i.id
    limit 1;

    if v_inst is null then
      raise exception 'No active institution is configured for account registration';
    end if;

    if exists (
      select 1
      from public.institutions i
      where i.deleted_at is null and i.id <> v_inst
    ) then
      raise exception 'Account registration requires a trusted institution assignment';
    end if;
  elsif not exists (
    select 1
    from public.institutions i
    where i.id = v_inst and i.deleted_at is null
  ) then
    raise exception 'The assigned institution is not active';
  end if;

  if new.raw_app_meta_data ->> 'role' = 'admin' then
    v_role := 'admin';
  elsif new.raw_user_meta_data ->> 'role' = 'teacher' then
    v_role := 'teacher';
  else
    v_role := 'student';
  end if;

  v_first := coalesce(nullif(new.raw_user_meta_data ->> 'first_name', ''), 'New');
  v_last := coalesce(nullif(new.raw_user_meta_data ->> 'last_name', ''), 'User');

  insert into public.profiles (id, institution_id, role, first_name, last_name, email, status)
  values (
    new.id,
    v_inst,
    v_role,
    v_first,
    v_last,
    new.email,
    case when v_role = 'admin' then 'invited'::public.profile_status else 'active'::public.profile_status end
  )
  on conflict (id) do nothing;

  if v_role = 'student' then
    insert into public.students (
      institution_id, profile_id, student_number, first_name, last_name, email, program, year_level
    )
    values (
      v_inst, new.id, 'STU-' || substr(new.id::text, 1, 8), v_first, v_last, new.email, 'BSc', 1
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
