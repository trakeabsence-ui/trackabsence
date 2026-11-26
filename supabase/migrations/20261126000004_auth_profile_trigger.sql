-- ============================================================================
-- ClassTrack · 0004 Auto-create profile on auth signup
-- ============================================================================
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
    select id into v_inst from public.institutions order by created_at limit 1;
  end if;
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'student');
  v_first := coalesce(nullif(new.raw_user_meta_data ->> 'first_name', ''), 'New');
  v_last := coalesce(nullif(new.raw_user_meta_data ->> 'last_name', ''), 'User');

  insert into public.profiles (id, institution_id, role, first_name, last_name, email, status)
  values (new.id, v_inst, v_role, v_first, v_last, new.email,
          case when v_role = 'admin' then 'invited'::public.profile_status else 'active'::public.profile_status end)
  on conflict (id) do nothing;

  if v_role = 'student' then
    insert into public.students (institution_id, profile_id, student_number, first_name, last_name, email, program, year_level)
    values (v_inst, new.id, 'STU-' || substr(new.id::text, 1, 8), v_first, v_last, new.email, 'BSc', 1)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
