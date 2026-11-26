-- ============================================================================
-- ClassTrack — Supabase / PostgreSQL schema
-- Version: 1.0
-- Requires: PostgreSQL 15+, Supabase (auth schema), pgcrypto, pg_trgm
-- ============================================================================
-- Conventions
--   * Every tenant-scoped table carries institution_id for fast, auditable RLS.
--   * Soft deletes use deleted_at; application queries filter it out.
--   * All timestamps are timestamptz; display uses institutions.timezone.
--   * Client access is restricted by RLS. Privileged flows use SECURITY DEFINER
--     functions with explicit authorization checks.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.user_role         as enum ('teacher', 'admin', 'student');
create type public.session_status    as enum ('scheduled', 'live', 'completed', 'cancelled', 'rescheduled');
create type public.attendance_status as enum ('present', 'late', 'absent', 'excused');
create type public.attendance_source as enum ('manual', 'qr', 'auto', 'import');
create type public.risk_level        as enum ('healthy', 'watch', 'at_risk', 'critical');
create type public.import_status     as enum ('uploaded', 'processing', 'review', 'committed', 'failed');
create type public.import_source     as enum ('manual', 'excel', 'ai_image', 'ai_structured');
create type public.change_type       as enum ('cancelled', 'rescheduled', 'room_changed', 'time_changed');
create type public.notification_type as enum ('session', 'attendance', 'import', 'report', 'system', 'invite');

-- ----------------------------------------------------------------------------
-- Institutions & academic structure
-- ----------------------------------------------------------------------------
create table public.institutions (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  slug                      text not null unique,
  timezone                  text not null default 'Africa/Casablanca',
  logo_url                  text,
  primary_color             text not null default '#2563EB',
  -- session / QR policy
  grace_open_minutes        int  not null default 10  check (grace_open_minutes between 0 and 120),
  late_after_minutes        int  not null default 15  check (late_after_minutes between 0 and 180),
  checkin_close_minutes     int  not null default 45  check (checkin_close_minutes between 5 and 240),
  qr_rotation_seconds       int  not null default 20  check (qr_rotation_seconds between 10 and 60),
  attendance_edit_hours     int  not null default 24  check (attendance_edit_hours between 0 and 720),
  risk_warning_threshold    numeric(5,2) not null default 75.00,
  risk_critical_threshold   numeric(5,2) not null default 60.00,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

create table public.departments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  code           text not null,
  head_name      text,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (institution_id, code)
);

create table public.terms (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,                 -- e.g. "Fall 2026"
  starts_on      date not null,
  ends_on        date not null,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now(),
  check (ends_on > starts_on),
  unique (institution_id, name)
);

create table public.holidays (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  holiday_date   date not null,
  unique (institution_id, holiday_date)
);

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) & students
-- ----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  role           public.user_role not null default 'teacher',
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text,
  title          text,                          -- "Associate Professor"
  department_id  uuid references public.departments(id) on delete set null,
  office         text,
  bio            text,
  avatar_url     text,
  status         text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  last_active_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index profiles_institution_idx on public.profiles (institution_id, role) where deleted_at is null;

create table public.students (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  profile_id     uuid references public.profiles(id) on delete set null,  -- optional login
  student_number text not null,
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text,
  program        text not null,
  year_level     int  not null default 1 check (year_level between 1 and 8),
  avatar_url     text,
  risk_level     public.risk_level not null default 'healthy',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (institution_id, student_number),
  unique (institution_id, email)
);
create index students_name_trgm_idx on public.students using gin ((first_name || ' ' || last_name) gin_trgm_ops);
create index students_institution_idx on public.students (institution_id) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Classes, timetable, enrollments
-- ----------------------------------------------------------------------------
create table public.classes (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  term_id        uuid not null references public.terms(id) on delete restrict,
  teacher_id     uuid not null references public.profiles(id) on delete restrict,
  department_id  uuid references public.departments(id) on delete set null,
  code           text not null,                 -- "CS-301"
  title          text not null,
  description    text,
  room           text,
  color          text not null default '#2563EB',
  expected_students int not null default 0,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (institution_id, term_id, code)
);
create index classes_teacher_idx on public.classes (teacher_id) where deleted_at is null;

create table public.timetable_entries (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid not null references public.classes(id) on delete cascade,
  weekday        smallint not null check (weekday between 1 and 7),  -- ISO-8601, 1 = Monday
  starts_at_time time not null,
  ends_at_time   time not null,
  room           text,
  valid_from     date not null,
  valid_until    date not null,
  created_at     timestamptz not null default now(),
  check (ends_at_time > starts_at_time),
  check (valid_until >= valid_from)
);
create index timetable_class_idx on public.timetable_entries (class_id, weekday);

create table public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid not null references public.classes(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete cascade,
  enrolled_at    timestamptz not null default now(),
  status         text not null default 'active' check (status in ('active', 'dropped', 'completed')),
  deleted_at     timestamptz,
  unique (class_id, student_id)
);
create index enrollments_student_idx on public.enrollments (student_id);

-- ----------------------------------------------------------------------------
-- Sessions, attendance, QR
-- ----------------------------------------------------------------------------
create table public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete cascade,
  class_id            uuid not null references public.classes(id) on delete cascade,
  timetable_entry_id  uuid references public.timetable_entries(id) on delete set null,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  room                text,
  status              public.session_status not null default 'scheduled',
  qr_enabled          boolean not null default true,
  opened_at           timestamptz,
  closed_at           timestamptz,
  cancel_reason       text,
  rescheduled_to      uuid references public.sessions(id) on delete set null,
  notes               text,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index sessions_class_time_idx on public.sessions (class_id, starts_at desc);
create index sessions_live_idx on public.sessions (institution_id, status) where status in ('scheduled', 'live');

create table public.attendance (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  session_id     uuid not null references public.sessions(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete cascade,
  status         public.attendance_status not null,
  late_minutes   int check (late_minutes is null or late_minutes >= 0),
  source         public.attendance_source not null default 'manual',
  excused_reason text,
  evidence_url   text,
  marked_by      uuid references public.profiles(id) on delete set null,
  marked_at      timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (session_id, student_id),
  check (status <> 'late' or late_minutes is not null),
  check (status <> 'excused' or excused_reason is not null)
);
create index attendance_session_idx on public.attendance (session_id);
create index attendance_student_idx on public.attendance (student_id, marked_at desc);

-- Opaque, rotating QR tokens. Never readable by clients.
create table public.qr_tokens (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  token_hash  text not null unique,
  nonce       text not null default encode(gen_random_bytes(8), 'hex'),
  issued_by   uuid references public.profiles(id) on delete set null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index qr_tokens_session_idx on public.qr_tokens (session_id, expires_at desc);

-- ----------------------------------------------------------------------------
-- Imports, AI extraction audit, notifications, audit log
-- ----------------------------------------------------------------------------
create table public.import_jobs (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid references public.classes(id) on delete cascade,
  created_by     uuid not null references public.profiles(id) on delete cascade,
  source         public.import_source not null,
  status         public.import_status not null default 'uploaded',
  file_path      text,
  file_name      text,
  total_rows     int not null default 0,
  valid_rows     int not null default 0,
  warning_rows   int not null default 0,
  error_rows     int not null default 0,
  error_report_path text,
  summary        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index import_jobs_owner_idx on public.import_jobs (created_by, created_at desc);

create table public.timetable_imports (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid references public.classes(id) on delete cascade,
  created_by     uuid not null references public.profiles(id) on delete cascade,
  source         public.import_source not null,       -- ai_image | ai_structured | manual
  source_path    text,
  model          text,
  raw_response   jsonb,
  extracted_rows jsonb not null default '[]'::jsonb,
  corrections    jsonb not null default '[]'::jsonb,
  status         public.import_status not null default 'review',
  created_at     timestamptz not null default now(),
  committed_at   timestamptz
);

create table public.session_changes (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  session_id     uuid not null references public.sessions(id) on delete cascade,
  change         public.change_type not null,
  reason         text not null,
  previous       jsonb not null default '{}'::jsonb,
  new_values     jsonb not null default '{}'::jsonb,
  changed_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           public.notification_type not null default 'system',
  title          text not null,
  body           text,
  link           text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc) where read_at is null;

create table public.audit_logs (
  id             bigint generated always as identity primary key,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  actor_id       uuid references public.profiles(id) on delete set null,
  action         text not null,                  -- attendance.update, session.cancel…
  entity_type    text not null,
  entity_id      uuid,
  before_data    jsonb,
  after_data     jsonb,
  ip_address     inet,
  user_agent     text,
  created_at     timestamptz not null default now()
);
create index audit_logs_institution_idx on public.audit_logs (institution_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.report_exports (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  requested_by   uuid references public.profiles(id) on delete set null,
  report_type    text not null,
  filters        jsonb not null default '{}'::jsonb,
  file_path      text,
  row_count      int,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper functions (used by RLS)
-- ----------------------------------------------------------------------------
create or replace function public.current_institution_id()
returns uuid language sql stable security definer set search_path = public
as $$ select institution_id from public.profiles where id = auth.uid() and deleted_at is null $$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and deleted_at is null $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_user_role() = 'admin', false) $$;

create or replace function public.can_manage_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.deleted_at is null
      and (
        public.is_admin()
        or c.teacher_id = auth.uid()
      )
  );
$$;

create or replace function public.can_access_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.deleted_at is null
      and (
        public.is_admin()
        or c.teacher_id = auth.uid()
        or exists (
          select 1
          from public.enrollments e
          join public.students s on s.id = e.student_id
          where e.class_id = c.id and s.profile_id = auth.uid() and e.deleted_at is null
        )
      )
  );
$$;

create or replace function public.is_enrolled_in_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.sessions se
    join public.enrollments e on e.class_id = se.class_id and e.deleted_at is null
    join public.students s on s.id = e.student_id
    where se.id = p_session_id and s.profile_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Domain functions
-- ----------------------------------------------------------------------------

-- Attendance rate: (present + 0.5 * late) / (present + late + absent)
-- Excused absences are excluded from the denominator.
create or replace function public.attendance_rate(
  p_present int, p_late int, p_absent int
) returns numeric language sql immutable as $$
  select case
    when (p_present + p_late + p_absent) = 0 then null
    else round(((p_present + 0.5 * p_late)::numeric / (p_present + p_late + p_absent)) * 100, 2)
  end;
$$;

-- Current live session(s) for the caller (or for a teacher when admin).
create or replace function public.rpc_current_session(p_teacher_id uuid default null)
returns table (
  session_id uuid, class_id uuid, class_code text, class_title text,
  starts_at timestamptz, ends_at timestamptz, room text, status public.session_status
) language sql stable security definer set search_path = public
as $$
  select s.id, c.id, c.code, c.title, s.starts_at, s.ends_at, s.room, s.status
  from public.sessions s
  join public.classes c on c.id = s.class_id
  where s.institution_id = public.current_institution_id()
    and s.status in ('scheduled', 'live')
    and now() between s.starts_at - make_interval(mins => (select grace_open_minutes from public.institutions where id = s.institution_id))
                and s.ends_at
    and (
      public.is_admin()
      or c.teacher_id = coalesce(p_teacher_id, auth.uid())
    )
  order by s.starts_at;
$$;

-- Start a scheduled session manually.
create or replace function public.rpc_start_session(p_session_id uuid)
returns public.sessions language plpgsql security definer set search_path = public
as $$
declare v_session public.sessions;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found' using errcode = 'P0002'; end if;
  if not public.can_manage_class(v_session.class_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_session.status not in ('scheduled') then
    raise exception 'invalid_session_state' using errcode = 'P0001';
  end if;

  update public.sessions
     set status = 'live', opened_at = now(), updated_at = now()
   where id = p_session_id
   returning * into v_session;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_session.institution_id, auth.uid(), 'session.start', 'session', v_session.id,
          jsonb_build_object('status', 'live'));

  return v_session;
end $$;

-- Close a live session; unmarked students become absent.
create or replace function public.rpc_close_session(p_session_id uuid)
returns public.sessions language plpgsql security definer set search_path = public
as $$
declare v_session public.sessions;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found'; end if;
  if not public.can_manage_class(v_session.class_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status <> 'live' then raise exception 'invalid_session_state'; end if;

  insert into public.attendance (institution_id, session_id, student_id, status, source, marked_by)
  select v_session.institution_id, v_session.id, e.student_id, 'absent', 'auto', auth.uid()
  from public.enrollments e
  where e.class_id = v_session.class_id and e.deleted_at is null
  on conflict (session_id, student_id) do nothing;

  update public.sessions
     set status = 'completed', closed_at = now(), updated_at = now()
   where id = p_session_id
   returning * into v_session;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id)
  values (v_session.institution_id, auth.uid(), 'session.close', 'session', v_session.id);

  return v_session;
end $$;

-- Cancel or reschedule. For reschedule, pass the replacement start/end.
create or replace function public.rpc_change_session(
  p_session_id uuid,
  p_change public.change_type,
  p_reason text,
  p_new_start timestamptz default null,
  p_new_end   timestamptz default null,
  p_new_room  text default null
) returns public.sessions language plpgsql security definer set search_path = public
as $$
declare v_old public.sessions; v_new public.sessions;
begin
  select * into v_old from public.sessions where id = p_session_id for update;
  if not found then raise exception 'session_not_found'; end if;
  if not public.can_manage_class(v_old.class_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_old.status in ('completed', 'cancelled') then raise exception 'session_locked'; end if;

  if p_change = 'cancelled' then
    update public.sessions set status = 'cancelled', cancel_reason = p_reason, qr_enabled = false, updated_at = now()
     where id = p_session_id returning * into v_new;
  else
    if p_new_start is null or p_new_end is null or p_new_end <= p_new_start then
      raise exception 'invalid_new_time';
    end if;
    insert into public.sessions (institution_id, class_id, timetable_entry_id, starts_at, ends_at, room, status, created_by)
    values (v_old.institution_id, v_old.class_id, v_old.timetable_entry_id, p_new_start, p_new_end,
            coalesce(p_new_room, v_old.room), 'scheduled', auth.uid())
    returning * into v_new;

    update public.sessions set status = 'rescheduled', rescheduled_to = v_new.id, cancel_reason = p_reason, qr_enabled = false
     where id = p_session_id;
  end if;

  insert into public.session_changes (institution_id, session_id, change, reason, previous, new_values, changed_by)
  values (v_old.institution_id, p_session_id, p_change, p_reason,
          jsonb_build_object('starts_at', v_old.starts_at, 'ends_at', v_old.ends_at, 'room', v_old.room),
          jsonb_build_object('new_session_id', v_new.id, 'starts_at', p_new_start, 'ends_at', p_new_end),
          auth.uid());

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_old.institution_id, auth.uid(), 'session.' || p_change, 'session', p_session_id,
          jsonb_build_object('reason', p_reason, 'new_session_id', v_new.id));

  return v_new;
end $$;

-- Issue a rotating QR token. Returns the raw token once; only its hash is stored.
create or replace function public.rpc_issue_qr_token(p_session_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_session public.sessions;
  v_inst public.institutions;
  v_raw text;
  v_ttl int;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'session_not_found'; end if;
  if not public.can_manage_class(v_session.class_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_session.status <> 'live' or not v_session.qr_enabled then raise exception 'qr_unavailable'; end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  v_ttl := v_inst.qr_rotation_seconds;
  v_raw := encode(gen_random_bytes(24), 'hex');

  insert into public.qr_tokens (session_id, token_hash, issued_by, expires_at)
  values (p_session_id, encode(digest(v_raw, 'sha256'), 'hex'), auth.uid(), now() + make_interval(secs => v_ttl));

  -- opportunistic cleanup
  delete from public.qr_tokens where session_id = p_session_id and expires_at < now() - interval '1 hour';

  return query select v_raw, now() + make_interval(secs => v_ttl);
end $$;

-- Student check-in. Validates token, enrollment, window and duplicates.
create or replace function public.rpc_check_in(p_token text)
returns table (attendance_id uuid, status public.attendance_status, checked_in_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_token public.qr_tokens;
  v_session public.sessions;
  v_inst public.institutions;
  v_student public.students;
  v_late_minutes int;
  v_status public.attendance_status;
  v_att public.attendance;
  v_grace_end timestamptz;
  v_close_at timestamptz;
begin
  select * into v_token
  from public.qr_tokens
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and revoked_at is null
    and expires_at > now() - interval '20 seconds'
  order by created_at desc
  limit 1;

  if not found then raise exception 'invalid_or_expired_token' using errcode = 'P0001'; end if;

  select * into v_session from public.sessions where id = v_token.session_id;
  if v_session.status <> 'live' or not v_session.qr_enabled then
    raise exception 'checkin_closed' using errcode = 'P0001';
  end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  v_close_at := v_session.starts_at + make_interval(mins => v_inst.checkin_close_minutes);
  if now() > v_close_at then raise exception 'checkin_window_closed' using errcode = 'P0001'; end if;

  select s.* into v_student
  from public.students s
  join public.enrollments e on e.student_id = s.id and e.deleted_at is null
  where s.profile_id = auth.uid()
    and e.class_id = v_session.class_id
    and s.deleted_at is null;

  if not found then raise exception 'not_enrolled' using errcode = '42501'; end if;

  if exists (select 1 from public.attendance where session_id = v_session.id and student_id = v_student.id) then
    raise exception 'already_checked_in' using errcode = 'P0001';
  end if;

  v_grace_end := v_session.starts_at + make_interval(mins => v_inst.late_after_minutes);
  if now() <= v_grace_end then
    v_status := 'present';
    v_late_minutes := null;
  else
    v_status := 'late';
    v_late_minutes := greatest(1, ceil(extract(epoch from (now() - v_session.starts_at)) / 60)::int);
  end if;

  insert into public.attendance (institution_id, session_id, student_id, status, late_minutes, source, marked_by, marked_at)
  values (v_session.institution_id, v_session.id, v_student.id, v_status, v_late_minutes, 'qr', auth.uid(), now())
  returning * into v_att;

  return query select v_att.id, v_att.status, v_att.marked_at;
end $$;

-- Batch attendance save (teacher). Rejects changes outside the edit window.
create or replace function public.rpc_save_attendance(p_session_id uuid, p_rows jsonb)
returns int language plpgsql security definer set search_path = public
as $$
declare
  v_session public.sessions;
  v_inst public.institutions;
  v_count int := 0;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then raise exception 'session_not_found'; end if;
  if not public.can_manage_class(v_session.class_id) then raise exception 'forbidden' using errcode = '42501'; end if;

  select * into v_inst from public.institutions where id = v_session.institution_id;
  if now() > v_session.ends_at + make_interval(hours => v_inst.attendance_edit_hours) and not public.is_admin() then
    raise exception 'edit_window_closed';
  end if;

  insert into public.attendance (institution_id, session_id, student_id, status, late_minutes, source, marked_by, updated_at)
  select v_session.institution_id, p_session_id,
         (r ->> 'student_id')::uuid,
         (r ->> 'status')::public.attendance_status,
         nullif(r ->> 'late_minutes', '')::int,
         'manual', auth.uid(), now()
  from jsonb_array_elements(p_rows) r
  on conflict (session_id, student_id) do update
    set status = excluded.status,
        late_minutes = excluded.late_minutes,
        source = 'manual',
        marked_by = auth.uid(),
        updated_at = now();

  get diagnostics v_count = row_count;

  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, after_data)
  values (v_session.institution_id, auth.uid(), 'attendance.bulk_save', 'session', p_session_id,
          jsonb_build_object('rows', v_count));

  return v_count;
end $$;

-- ----------------------------------------------------------------------------
-- Analytics views (security_invoker respects RLS)
-- ----------------------------------------------------------------------------
create or replace view public.v_class_attendance
with (security_invoker = true) as
select
  c.id as class_id,
  c.institution_id,
  c.teacher_id,
  c.code,
  c.title,
  count(distinct e.student_id) filter (where e.deleted_at is null) as students,
  count(distinct s.id) filter (where s.status = 'completed') as sessions_held,
  count(a.id) filter (where a.status = 'present') as present_count,
  count(a.id) filter (where a.status = 'late') as late_count,
  count(a.id) filter (where a.status = 'absent') as absent_count,
  count(a.id) filter (where a.status = 'excused') as excused_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.classes c
left join public.enrollments e on e.class_id = c.id
left join public.sessions s on s.class_id = c.id and s.status = 'completed'
left join public.attendance a on a.session_id = s.id
where c.deleted_at is null
group by c.id;

create or replace view public.v_student_attendance
with (security_invoker = true) as
select
  st.id as student_id,
  st.institution_id,
  st.first_name,
  st.last_name,
  st.email,
  st.student_number,
  st.risk_level,
  count(a.id) as records,
  count(a.id) filter (where a.status = 'present') as present_count,
  count(a.id) filter (where a.status = 'late') as late_count,
  count(a.id) filter (where a.status = 'absent') as absent_count,
  count(a.id) filter (where a.status = 'excused') as excused_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.students st
left join public.attendance a on a.student_id = st.id
where st.deleted_at is null
group by st.id;

create or replace view public.v_teacher_performance
with (security_invoker = true) as
select
  p.id as teacher_id,
  p.institution_id,
  p.first_name,
  p.last_name,
  p.email,
  p.title,
  d.name as department,
  count(distinct c.id) as classes,
  count(distinct e.student_id) as students,
  count(distinct s.id) filter (where s.status = 'completed') as sessions_held,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.profiles p
left join public.departments d on d.id = p.department_id
left join public.classes c on c.teacher_id = p.id and c.deleted_at is null
left join public.enrollments e on e.class_id = c.id
left join public.sessions s on s.class_id = c.id
left join public.attendance a on a.session_id = s.id
where p.role = 'teacher' and p.deleted_at is null
group by p.id, d.name;

create or replace view public.v_daily_attendance
with (security_invoker = true) as
select
  s.institution_id,
  (s.starts_at at time zone i.timezone)::date as day,
  count(a.id) filter (where a.status = 'present') as present_count,
  count(a.id) filter (where a.status = 'late') as late_count,
  count(a.id) filter (where a.status = 'absent') as absent_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.sessions s
join public.institutions i on i.id = s.institution_id
left join public.attendance a on a.session_id = s.id
where s.status = 'completed'
group by s.institution_id, i.timezone, (s.starts_at at time zone i.timezone)::date;

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_institutions_updated before update on public.institutions
  for each row execute function public.fn_set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.fn_set_updated_at();
create trigger trg_students_updated before update on public.students
  for each row execute function public.fn_set_updated_at();
create trigger trg_classes_updated before update on public.classes
  for each row execute function public.fn_set_updated_at();
create trigger trg_sessions_updated before update on public.sessions
  for each row execute function public.fn_set_updated_at();

-- Keep student risk level in sync with the latest computed rate.
create or replace function public.fn_refresh_student_risk(p_student_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_rate numeric; v_warn numeric; v_crit numeric; v_inst uuid;
begin
  select institution_id into v_inst from public.students where id = p_student_id;
  select risk_warning_threshold, risk_critical_threshold into v_warn, v_crit
    from public.institutions where id = v_inst;

  select public.attendance_rate(
    count(*) filter (where status = 'present')::int,
    count(*) filter (where status = 'late')::int,
    count(*) filter (where status = 'absent')::int
  ) into v_rate
  from public.attendance where student_id = p_student_id;

  update public.students
     set risk_level = case
       when v_rate is null then 'healthy'
       when v_rate < v_crit then 'critical'
       when v_rate < v_warn then 'at_risk'
       when v_rate < v_warn + 8 then 'watch'
       else 'healthy' end
   where id = p_student_id;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.institutions        enable row level security;
alter table public.departments         enable row level security;
alter table public.terms               enable row level security;
alter table public.holidays            enable row level security;
alter table public.profiles            enable row level security;
alter table public.students            enable row level security;
alter table public.classes             enable row level security;
alter table public.timetable_entries   enable row level security;
alter table public.enrollments         enable row level security;
alter table public.sessions            enable row level security;
alter table public.attendance          enable row level security;
alter table public.qr_tokens           enable row level security;
alter table public.import_jobs         enable row level security;
alter table public.timetable_imports   enable row level security;
alter table public.session_changes     enable row level security;
alter table public.notifications       enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.report_exports      enable row level security;

-- Institutions: members read their own; admins update.
create policy institutions_select on public.institutions for select
  using (id = public.current_institution_id());
create policy institutions_update on public.institutions for update
  using (id = public.current_institution_id() and public.is_admin())
  with check (id = public.current_institution_id() and public.is_admin());

-- Departments / terms / holidays
create policy departments_select on public.departments for select
  using (institution_id = public.current_institution_id());
create policy departments_write on public.departments for all
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

create policy terms_select on public.terms for select
  using (institution_id = public.current_institution_id());
create policy terms_write on public.terms for all
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

create policy holidays_select on public.holidays for select
  using (institution_id = public.current_institution_id());
create policy holidays_write on public.holidays for all
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

-- Profiles: self, or admin within the same institution.
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or (institution_id = public.current_institution_id() and public.is_admin())
  );
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and institution_id = public.current_institution_id());
create policy profiles_admin_write on public.profiles for all
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

-- Students: admins; teachers with the student in one of their classes; the student themself.
create policy students_select on public.students for select
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or profile_id = auth.uid()
      or exists (
        select 1 from public.enrollments e
        join public.classes c on c.id = e.class_id
        where e.student_id = students.id and c.teacher_id = auth.uid() and e.deleted_at is null
      )
    )
  );
create policy students_write on public.students for all
  using (institution_id = public.current_institution_id() and (public.is_admin() or public.current_user_role() = 'teacher'))
  with check (institution_id = public.current_institution_id() and (public.is_admin() or public.current_user_role() = 'teacher'));

-- Classes
create policy classes_select on public.classes for select
  using (
    institution_id = public.current_institution_id()
    and (public.is_admin() or teacher_id = auth.uid() or public.can_access_class(id))
  );
create policy classes_insert on public.classes for insert
  with check (institution_id = public.current_institution_id() and (public.is_admin() or teacher_id = auth.uid()));
create policy classes_update on public.classes for update
  using (public.can_manage_class(id))
  with check (institution_id = public.current_institution_id());

-- Timetable entries follow class access.
create policy timetable_select on public.timetable_entries for select
  using (public.can_access_class(class_id));
create policy timetable_write on public.timetable_entries for all
  using (public.can_manage_class(class_id))
  with check (public.can_manage_class(class_id));

-- Enrollments: class managers and the enrolled student.
create policy enrollments_select on public.enrollments for select
  using (
    institution_id = public.current_institution_id()
    and (
      public.can_manage_class(class_id)
      or exists (
        select 1 from public.students s
        where s.id = enrollments.student_id and s.profile_id = auth.uid()
      )
    )
  );
create policy enrollments_write on public.enrollments for all
  using (public.can_manage_class(class_id))
  with check (public.can_manage_class(class_id));

-- Sessions
create policy sessions_select on public.sessions for select
  using (public.can_access_class(class_id));
create policy sessions_write on public.sessions for all
  using (public.can_manage_class(class_id))
  with check (public.can_manage_class(class_id));

-- Attendance: class managers, the student, admins.
create policy attendance_select on public.attendance for select
  using (
    public.is_admin()
    or public.can_manage_class((select class_id from public.sessions where id = attendance.session_id))
    or exists (
      select 1 from public.students s
      where s.id = attendance.student_id and s.profile_id = auth.uid()
    )
  );
create policy attendance_write on public.attendance for all
  using (public.can_manage_class((select class_id from public.sessions where id = attendance.session_id)))
  with check (public.can_manage_class((select class_id from public.sessions where id = attendance.session_id)));

-- QR tokens: no client access at all; only SECURITY DEFINER functions and service role.
create policy qr_tokens_deny_all on public.qr_tokens for all using (false) with check (false);
revoke all on public.qr_tokens from anon, authenticated;

-- Imports
create policy import_jobs_select on public.import_jobs for select
  using (public.is_admin() or created_by = auth.uid());
create policy import_jobs_write on public.import_jobs for all
  using (public.is_admin() or created_by = auth.uid())
  with check (institution_id = public.current_institution_id());

create policy timetable_imports_select on public.timetable_imports for select
  using (public.is_admin() or created_by = auth.uid());
create policy timetable_imports_write on public.timetable_imports for all
  using (public.is_admin() or created_by = auth.uid())
  with check (institution_id = public.current_institution_id());

-- Session changes follow class access.
create policy session_changes_select on public.session_changes for select
  using (public.can_access_class((select class_id from public.sessions where id = session_changes.session_id)));
create policy session_changes_insert on public.session_changes for insert
  with check (public.can_manage_class((select class_id from public.sessions where id = session_changes.session_id)));

-- Notifications: own rows only.
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Audit logs: admins read; writes only via definer functions/service role.
create policy audit_logs_select on public.audit_logs for select
  using (institution_id = public.current_institution_id() and public.is_admin());

-- Report exports
create policy report_exports_select on public.report_exports for select
  using (public.is_admin() or requested_by = auth.uid());
create policy report_exports_insert on public.report_exports for insert
  with check (institution_id = public.current_institution_id());

-- ----------------------------------------------------------------------------
-- Realtime publication (live counters / session state)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.notifications;

-- ----------------------------------------------------------------------------
-- Storage buckets (run in Supabase SQL editor)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars',    'avatars',    true),
  ('imports',    'imports',    false),
  ('timetables', 'timetables', false),
  ('reports',    'reports',    false)
on conflict (id) do nothing;

-- Avatars: public read, owner write (path prefix = user id).
create policy avatars_read on storage.objects for select
  using (bucket_id = 'avatars');
create policy avatars_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
