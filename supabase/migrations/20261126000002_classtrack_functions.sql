-- ============================================================================
-- ClassTrack · 0002 Authorization helpers + privileged RPCs
-- All helpers/functions are SECURITY DEFINER with a locked search_path.
-- Every privileged mutation re-checks authorization inside the function;
-- RLS is the outer boundary, these checks are the inner boundary.
-- ============================================================================

set local search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- Session context helpers (used by RLS and RPCs)
-- ----------------------------------------------------------------------------
create or replace function public.current_institution_id()
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select p.institution_id
  from public.profiles p
  where p.id = auth.uid() and p.deleted_at is null
$$;

create or replace function public.current_app_role()
returns public.user_role language sql stable security definer set search_path = public, pg_temp as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.deleted_at is null
$$;

-- Bootstrap-friendly: service role key and local migration role are admins.
-- Normal JWT users are never treated as admins unless their profile says so.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.role() = 'service_role'
      or session_user in ('postgres', 'supabase_admin')
      or coalesce((
        select p.role = 'admin'
        from public.profiles p
        where p.id = auth.uid() and p.deleted_at is null
      ), false)
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(public.current_app_role() = 'teacher', false)
$$;

create or replace function public.is_student()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(public.current_app_role() = 'student', false)
$$;

create or replace function public.can_manage_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.deleted_at is null
      and (public.is_admin() or (public.is_teacher() and c.teacher_id = auth.uid()))
  )
$$;

-- Full class access includes: owner, admin, module teacher, enrolled student.
create or replace function public.can_view_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.deleted_at is null
      and (
        public.is_admin()
        or (public.is_teacher() and c.teacher_id = auth.uid())
        or exists (
          select 1 from public.class_modules cm
          join public.modules m on m.id = cm.module_id
          where cm.class_id = c.id
            and m.owner_teacher_id = auth.uid()
            and m.deleted_at is null
            and public.is_teacher()
        )
        or exists (
          select 1 from public.enrollments e
          join public.students st on st.id = e.student_id
          where e.class_id = c.id
            and st.profile_id = auth.uid()
            and e.status = 'active'
            and e.deleted_at is null
            and st.deleted_at is null
        )
      )
  )
$$;

create or replace function public.owns_module(p_module_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.modules m
    where m.id = p_module_id
      and m.deleted_at is null
      and (public.is_admin() or (public.is_teacher() and m.owner_teacher_id = auth.uid()))
  )
$$;

create or replace function public.can_view_module(p_module_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.modules m
    where m.id = p_module_id
      and m.deleted_at is null
      and (
        public.is_admin()
        or (public.is_teacher() and m.owner_teacher_id = auth.uid())
        or exists (
          select 1 from public.class_modules cm
          join public.enrollments e on e.class_id = cm.class_id
          join public.students st on st.id = e.student_id
          where cm.module_id = m.id
            and st.profile_id = auth.uid()
            and e.status = 'active'
            and e.deleted_at is null
            and st.deleted_at is null
        )
      )
  )
$$;

create or replace function public.teacher_owns_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_teacher() and exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student_id
      and e.status = 'active'
      and e.deleted_at is null
      and c.deleted_at is null
      and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.can_manage_schedule_rule(p_class_id uuid, p_class_module_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin()
      or public.can_manage_class(p_class_id)
      or exists (
        select 1 from public.class_modules cm
        join public.modules m on m.id = cm.module_id
        where cm.id = p_class_module_id
          and cm.class_id = p_class_id
          and m.owner_teacher_id = auth.uid()
          and m.deleted_at is null
          and public.is_teacher()
      )
$$;

create or replace function public.can_manage_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.sessions s
    where s.id = p_session_id
      and (
        public.is_admin()
        or (public.is_teacher() and s.teacher_id = auth.uid())
        or public.can_manage_class(s.class_id)
      )
  )
$$;

create or replace function public.can_view_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.sessions s
    where s.id = p_session_id
      and (
        public.is_admin()
        or (public.is_teacher() and s.teacher_id = auth.uid())
        or public.can_view_class(s.class_id)
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- Weekly timetable -> concrete session occurrences
-- ----------------------------------------------------------------------------
create or replace function public.rpc_generate_sessions(
  p_class_id uuid,
  p_from date,
  p_to date,
  p_replace_future boolean default false
) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_count int := 0;
begin
  if not (
    public.is_admin()
    or public.can_manage_class(p_class_id)
    or exists (
      select 1 from public.schedule_rules sr
      join public.class_modules cm on cm.id = sr.class_module_id
      join public.modules m on m.id = cm.module_id
      where sr.class_id = p_class_id
        and m.owner_teacher_id = auth.uid()
        and public.is_teacher()
    )
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'invalid_date_range' using errcode = '22023';
  end if;

  -- Timetable edits may rebuild future, untouched occurrences only.
  if p_replace_future then
    delete from public.sessions s
     where s.class_id = p_class_id
       and s.starts_at > now()
       and s.status = 'scheduled'
       and s.schedule_rule_id is not null;
  end if;

  with slots as (
    select
      sr.id as rule_id,
      sr.institution_id,
      sr.class_id,
      sr.class_module_id,
      m.owner_teacher_id,
      (greatest(sr.valid_from, p_from) + g.n) as day,
      sr.starts_at_time,
      sr.ends_at_time,
      sr.room,
      i.timezone
    from public.schedule_rules sr
    join public.class_modules cm on cm.id = sr.class_module_id
    join public.modules m on m.id = cm.module_id
    join public.institutions i on i.id = sr.institution_id
    cross join lateral generate_series(
      0,
      least(sr.valid_until, p_to) - greatest(sr.valid_from, p_from)
    ) as g(n)
    where sr.class_id = p_class_id
      and sr.is_active
      and extract(isodow from (greatest(sr.valid_from, p_from) + g.n)) = sr.weekday
      and not exists (
        select 1 from public.holidays h
        where h.institution_id = sr.institution_id
          and h.holiday_date = (greatest(sr.valid_from, p_from) + g.n)
      )
  )
  insert into public.sessions
    (institution_id, class_id, class_module_id, schedule_rule_id, teacher_id,
     starts_at, ends_at, room, status, created_by)
  select
    institution_id, class_id, class_module_id, rule_id, owner_teacher_id,
    (day + starts_at_time) at time zone timezone,
    (day + ends_at_time) at time zone timezone,
    room, 'scheduled', auth.uid()
  from slots
  on conflict (schedule_rule_id, starts_at) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ----------------------------------------------------------------------------
-- Live session discovery (server clock + institution timezone)
-- ----------------------------------------------------------------------------
create or replace function public.rpc_current_session(p_teacher_id uuid default null)
returns table (
  session_id uuid, class_id uuid, class_code text, class_title text,
  starts_at timestamptz, ends_at timestamptz, room text, status public.session_status
)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, c.id, c.code, c.title, s.starts_at, s.ends_at, s.room, s.status
  from public.sessions s
  join public.classes c on c.id = s.class_id
  join public.institutions i on i.id = s.institution_id
  where s.institution_id = public.current_institution_id()
    and c.deleted_at is null
    and s.status in ('scheduled', 'live')
    and now() between s.starts_at - make_interval(mins => i.checkin_opens_minutes_before)
                  and s.starts_at + make_interval(mins => i.checkin_closes_minutes_after)
    and (
      public.is_admin()
      or (public.is_teacher() and coalesce(p_teacher_id, auth.uid()) = auth.uid())
    )
  order by s.starts_at;
$$;

-- ----------------------------------------------------------------------------
-- Session lifecycle
-- ----------------------------------------------------------------------------
create or replace function public.rpc_start_session(p_session_id uuid)
returns public.sessions
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session public.sessions;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_session(p_session_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status <> 'scheduled' then raise exception 'invalid_session_state' using errcode = 'P0001'; end if;

  update public.sessions
     set status = 'live', opened_at = coalesce(opened_at, now()), updated_at = now()
   where id = p_session_id
  returning * into v_session;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_session.institution_id, auth.uid(), 'session.start', 'session', v_session.id,
          jsonb_build_object('status', 'live', 'opened_at', v_session.opened_at));
  return v_session;
end $$;

create or replace function public.rpc_close_session(p_session_id uuid)
returns public.sessions
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session public.sessions;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_session(p_session_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status <> 'live' then raise exception 'invalid_session_state' using errcode = 'P0001'; end if;

  update public.sessions
     set status = 'completed', closed_at = now(), qr_enabled = false, updated_at = now()
   where id = p_session_id
  returning * into v_session;

  -- Unmarked students become absent. Justified/manual records are preserved.
  -- Status is set first so the risk refresh trigger sees a completed session.
  insert into public.attendance
    (institution_id, session_id, student_id, status, source, marked_by)
  select v_session.institution_id, v_session.id, e.student_id, 'absent', 'auto', auth.uid()
  from public.enrollments e
  where e.class_id = v_session.class_id
    and e.status = 'active'
    and e.deleted_at is null
  on conflict (session_id, student_id) do nothing;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_session.institution_id, auth.uid(), 'session.close', 'session', v_session.id,
          jsonb_build_object('status', 'completed', 'closed_at', v_session.closed_at));
  return v_session;
end $$;

create or replace function public.rpc_change_session(
  p_session_id uuid,
  p_change public.change_type,
  p_reason text,
  p_new_start timestamptz default null,
  p_new_end timestamptz default null,
  p_new_room text default null
) returns public.sessions
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old public.sessions;
  v_new public.sessions;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  select * into v_old from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_session(p_session_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_old.status in ('completed', 'cancelled', 'rescheduled') then
    raise exception 'session_locked' using errcode = 'P0001';
  end if;

  if p_change = 'cancelled' then
    update public.sessions
       set status = 'cancelled', cancel_reason = p_reason, qr_enabled = false, updated_at = now()
     where id = p_session_id
    returning * into v_new;
  else
    if p_new_start is null or p_new_end is null or p_new_end <= p_new_start then
      raise exception 'invalid_new_time' using errcode = '22023';
    end if;

    -- Replacement is deliberately NOT tied to a weekly rule: it is a one-off.
    insert into public.sessions
      (institution_id, class_id, class_module_id, teacher_id, starts_at, ends_at,
       room, status, created_by)
    values
      (v_old.institution_id, v_old.class_id, v_old.class_module_id, v_old.teacher_id,
       p_new_start, p_new_end, coalesce(p_new_room, v_old.room), 'scheduled', auth.uid())
    returning * into v_new;

    update public.sessions
       set status = 'rescheduled', rescheduled_to = v_new.id, cancel_reason = p_reason,
           qr_enabled = false, updated_at = now()
     where id = p_session_id;
  end if;

  insert into public.session_changes
    (institution_id, session_id, change, reason, previous, new_values, changed_by)
  values
    (v_old.institution_id, p_session_id, p_change, p_reason,
     jsonb_build_object('starts_at', v_old.starts_at, 'ends_at', v_old.ends_at, 'room', v_old.room),
     jsonb_build_object('new_session_id', v_new.id, 'starts_at', p_new_start,
                        'ends_at', p_new_end, 'room', coalesce(p_new_room, v_old.room)),
     auth.uid());

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_old.institution_id, auth.uid(), 'session.' || p_change::text, 'session', p_session_id,
          jsonb_build_object('reason', p_reason, 'new_session_id', v_new.id));

  return v_new;
end $$;

-- ----------------------------------------------------------------------------
-- QR tokens: 4-second lifetime, hash at rest, no client read access.
-- ----------------------------------------------------------------------------
create or replace function public.rpc_issue_qr_token(p_session_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session public.sessions;
  v_inst public.institutions;
  v_raw text;
  v_ttl int;
  v_expires timestamptz;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_session(p_session_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status <> 'live' or not v_session.qr_enabled then
    raise exception 'qr_unavailable' using errcode = 'P0001';
  end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  v_ttl := coalesce(v_inst.qr_token_ttl_seconds, 4);
  v_raw := encode(extensions.gen_random_bytes(24), 'hex');   -- 192 bits of entropy
  v_expires := now() + make_interval(secs => v_ttl);

  insert into public.qr_tokens (institution_id, session_id, token_hash, issued_by, expires_at)
  values (v_session.institution_id, p_session_id,
          encode(extensions.sha256(convert_to(v_raw, 'UTF8')), 'hex'), auth.uid(), v_expires);

  delete from public.qr_tokens
   where session_id = p_session_id and expires_at < now() - interval '5 minutes';

  return query select v_raw, v_expires;
end $$;

create or replace function public.rpc_check_in(p_token text)
returns table (attendance_id uuid, status public.attendance_status, checked_in_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_now timestamptz := now();
  v_token public.qr_tokens;
  v_session public.sessions;
  v_inst public.institutions;
  v_student public.students;
  v_status public.attendance_status;
  v_late int;
  v_attendance_id uuid;
begin
  if p_token is null or length(p_token) < 16 then
    raise exception 'invalid_or_expired_token' using errcode = 'P0001';
  end if;
  if public.current_app_role() is distinct from 'student' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_token
  from public.qr_tokens
  where token_hash = encode(extensions.sha256(convert_to(p_token, 'UTF8')), 'hex')
    and expires_at > v_now
  order by created_at desc
  for update skip locked;

  if not found then raise exception 'invalid_or_expired_token' using errcode = 'P0001'; end if;

  select * into v_session from public.sessions where id = v_token.session_id;
  if v_session.status <> 'live' or not v_session.qr_enabled then
    raise exception 'checkin_closed' using errcode = 'P0001';
  end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  if v_now < v_session.starts_at - make_interval(mins => v_inst.checkin_opens_minutes_before)
     or v_now > v_session.starts_at + make_interval(mins => v_inst.checkin_closes_minutes_after) then
    raise exception 'checkin_window_closed' using errcode = 'P0001';
  end if;

  select st.* into v_student
  from public.students st
  join public.enrollments e on e.student_id = st.id
  where st.profile_id = auth.uid()
    and e.class_id = v_session.class_id
    and e.status = 'active'
    and e.deleted_at is null
    and st.deleted_at is null;

  if not found then raise exception 'not_enrolled' using errcode = '42501'; end if;

  if exists (
    select 1 from public.attendance
    where session_id = v_session.id and student_id = v_student.id
  ) then
    raise exception 'already_checked_in' using errcode = 'P0001';
  end if;

  -- One token may serve a whole room, but a student cannot replay it.
  begin
    insert into public.qr_token_uses (institution_id, token_id, student_id)
    values (v_student.institution_id, v_token.id, v_student.id);
  exception when unique_violation then
    raise exception 'token_already_used' using errcode = 'P0001';
  end;

  if v_now <= v_session.starts_at + make_interval(mins => v_inst.late_after_minutes) then
    v_status := 'present';
    v_late := null;
  else
    v_status := 'late';
    v_late := greatest(1, ceil(extract(epoch from (v_now - v_session.starts_at)) / 60)::int);
  end if;

  insert into public.attendance
    (institution_id, session_id, student_id, status, late_minutes, source, marked_by, marked_at)
  values
    (v_session.institution_id, v_session.id, v_student.id, v_status, v_late, 'qr', auth.uid(), v_now)
  returning id into v_attendance_id;

  return query select v_attendance_id, v_status, v_now;
end $$;

-- ----------------------------------------------------------------------------
-- Teacher attendance save / administrator correction
-- ----------------------------------------------------------------------------
create or replace function public.rpc_save_attendance(p_session_id uuid, p_rows jsonb)
returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session public.sessions;
  v_inst public.institutions;
  r record;
  v_row jsonb;
  v_student_id uuid;
  v_status public.attendance_status;
  v_late int;
  v_count int := 0;
begin
  if not (public.is_admin() or public.is_teacher()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(jsonb_typeof(p_rows), '') <> 'array' then
    raise exception 'rows_must_be_array' using errcode = '22023';
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_session(p_session_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status not in ('live', 'completed') then
    raise exception 'session_not_open_for_attendance' using errcode = 'P0001';
  end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  if not public.is_admin()
     and now() > v_session.ends_at + make_interval(hours => v_inst.attendance_edit_hours) then
    raise exception 'edit_window_closed' using errcode = 'P0001';
  end if;

  for r in select value as row_data from jsonb_array_elements(p_rows)
  loop
    v_row := r.row_data;
    v_student_id := (v_row ->> 'student_id')::uuid;
    v_status := (v_row ->> 'status')::public.attendance_status;
    v_late := nullif(v_row ->> 'late_minutes', '')::int;

    if not exists (
      select 1 from public.enrollments e
      where e.class_id = v_session.class_id
        and e.student_id = v_student_id
        and e.status = 'active'
        and e.deleted_at is null
    ) then
      raise exception 'student_not_enrolled' using errcode = '42501';
    end if;

    insert into public.attendance
      (institution_id, session_id, student_id, status, late_minutes, notes,
       justification_reason, justification_url, source, marked_by, marked_at)
    values
      (v_session.institution_id, p_session_id, v_student_id, v_status, v_late,
       nullif(v_row ->> 'notes', ''),
       nullif(v_row ->> 'justification_reason', ''),
       nullif(v_row ->> 'justification_url', ''),
       'teacher', auth.uid(), now())
    on conflict (session_id, student_id) do update
       set status = excluded.status,
           late_minutes = excluded.late_minutes,
           notes = excluded.notes,
           justification_reason = excluded.justification_reason,
           justification_url = excluded.justification_url,
           source = 'teacher',
           marked_by = excluded.marked_by,
           marked_at = excluded.marked_at,
           updated_at = now();

    v_count := v_count + 1;
  end loop;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_session.institution_id, auth.uid(), 'attendance.bulk_save', 'session', p_session_id,
          jsonb_build_object('rows', v_count));

  return v_count;
end $$;

create or replace function public.rpc_admin_correct_attendance(
  p_session_id uuid,
  p_student_id uuid,
  p_status public.attendance_status,
  p_late_minutes int default null,
  p_reason text default null,
  p_notes text default null,
  p_justification_url text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session public.sessions;
  v_before jsonb;
  v_attendance_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'correction_reason_required' using errcode = '22023';
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not exists (
    select 1 from public.enrollments e
    where e.class_id = v_session.class_id
      and e.student_id = p_student_id
      and e.deleted_at is null
  ) then
    raise exception 'student_not_enrolled' using errcode = '42501';
  end if;

  select to_jsonb(a) into v_before
  from public.attendance a
  where a.session_id = p_session_id and a.student_id = p_student_id;

  insert into public.attendance
    (institution_id, session_id, student_id, status, late_minutes, notes,
     justification_reason, justification_url, source, marked_by, marked_at)
  values
    (v_session.institution_id, p_session_id, p_student_id, p_status, p_late_minutes,
     p_notes, p_reason, p_justification_url, 'admin_correction', auth.uid(), now())
  on conflict (session_id, student_id) do update
     set status = excluded.status,
         late_minutes = excluded.late_minutes,
         notes = excluded.notes,
         justification_reason = excluded.justification_reason,
         justification_url = excluded.justification_url,
         source = 'admin_correction',
         marked_by = excluded.marked_by,
         marked_at = excluded.marked_at,
         updated_at = now()
  returning id into v_attendance_id;

  insert into public.audit_logs
    (institution_id, actor_id, action, entity_type, entity_id, before_data, after_data)
  values
    (v_session.institution_id, auth.uid(), 'attendance.admin_correction', 'attendance',
     v_attendance_id, v_before,
     jsonb_build_object('session_id', p_session_id, 'student_id', p_student_id,
                        'status', p_status, 'reason', p_reason));

  return v_attendance_id;
end $$;

-- ----------------------------------------------------------------------------
-- Function privileges: helpers + RPCs only; trigger functions stay internal.
-- ----------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = any (array[
        'attendance_rate', 'current_institution_id', 'current_app_role',
        'is_admin', 'is_teacher', 'is_student', 'can_manage_class', 'can_view_class',
        'owns_module', 'can_view_module', 'teacher_owns_student',
        'can_manage_schedule_rule', 'can_manage_session', 'can_view_session',
        'rpc_generate_sessions', 'rpc_current_session', 'rpc_start_session',
        'rpc_close_session', 'rpc_change_session', 'rpc_issue_qr_token',
        'rpc_check_in', 'rpc_save_attendance', 'rpc_admin_correct_attendance'
      ])
  loop
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end $$;
