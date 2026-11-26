-- ============================================================================
-- ClassTrack · 0001 Core relational schema
-- Target: Supabase Postgres 15+
-- Scope: institutions, people, modules/classes, weekly schedules, sessions,
--        attendance, QR tokens, audit/history, reporting views.
-- Supersedes docs/03-database-schema.sql (which used 20s QR tokens / "excused").
-- ============================================================================

set local search_path = public, extensions;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.user_role         as enum ('teacher', 'admin', 'student');
create type public.profile_status    as enum ('invited', 'active', 'suspended');
create type public.attendance_status as enum ('present', 'late', 'absent', 'justified');
create type public.attendance_source as enum ('qr', 'teacher', 'auto', 'admin_correction', 'import');
create type public.session_status    as enum ('scheduled', 'live', 'completed', 'cancelled', 'rescheduled');
create type public.change_type       as enum ('cancelled', 'rescheduled', 'time_changed', 'room_changed');
create type public.risk_level        as enum ('healthy', 'watch', 'at_risk', 'critical');
create type public.import_kind       as enum ('students_csv', 'students_xlsx', 'timetable_image', 'timetable_text');
create type public.import_status     as enum ('staged', 'review', 'committed', 'failed');
create type public.notification_kind as enum ('session', 'attendance', 'risk', 'import', 'report', 'invite', 'system');

-- ----------------------------------------------------------------------------
-- Pure domain helper: weighted attendance rate
-- rate = (present + 0.5 * late) / (present + late + absent); justified excluded.
-- ----------------------------------------------------------------------------
create or replace function public.attendance_rate(
  p_present int, p_late int, p_absent int
) returns numeric
language sql immutable parallel safe
set search_path = public, pg_temp
as $$
  select case
    when coalesce(p_present, 0) + coalesce(p_late, 0) + coalesce(p_absent, 0) = 0 then null
    else round(
      (
        (coalesce(p_present, 0) + 0.5 * coalesce(p_late, 0))::numeric
        / (coalesce(p_present, 0) + coalesce(p_late, 0) + coalesce(p_absent, 0))::numeric
      ) * 100,
      2
    )
  end;
$$;

-- ----------------------------------------------------------------------------
-- Tenant root and academic calendar
-- ----------------------------------------------------------------------------
create table public.institutions (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  slug                        text not null unique,
  timezone                    text not null default 'Africa/Casablanca',
  -- Attendance windows (server-side authority; client clock is never trusted)
  checkin_opens_minutes_before int not null default 10  check (checkin_opens_minutes_before between 0 and 120),
  checkin_closes_minutes_after int not null default 15  check (checkin_closes_minutes_after between 1 and 240),
  late_after_minutes          int not null default 5    check (late_after_minutes between 0 and 240),
  -- QR policy. REQUIREMENT: temporary tokens live 4 seconds by default.
  qr_token_ttl_seconds        int not null default 4    check (qr_token_ttl_seconds between 1 and 60),
  attendance_edit_hours       int not null default 24   check (attendance_edit_hours between 0 and 720),
  risk_warning_pct            numeric(5,2) not null default 75.00 check (risk_warning_pct between 0 and 100),
  risk_critical_pct           numeric(5,2) not null default 60.00 check (risk_critical_pct between 0 and 100),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  deleted_at                  timestamptz,
  constraint risk_thresholds_ordered check (risk_critical_pct < risk_warning_pct)
);

create table public.departments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  code           text not null,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint departments_code_uq unique (institution_id, code),
  constraint departments_institution_id_uq unique (institution_id, id)
);

create table public.terms (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  starts_on      date not null,
  ends_on        date not null,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint terms_name_uq unique (institution_id, name),
  constraint terms_institution_id_uq unique (institution_id, id),
  constraint terms_dates_valid check (ends_on > starts_on)
);

create table public.holidays (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  holiday_date   date not null,
  constraint holidays_date_uq unique (institution_id, holiday_date)
);

-- ----------------------------------------------------------------------------
-- People. Public directory fields live in profiles; private fields are split
-- out so teachers can never read another teacher's private data through RLS.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  role           public.user_role not null,
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  title          text,
  department_id  uuid references public.departments(id) on delete set null,
  avatar_url     text,
  status         public.profile_status not null default 'active',
  last_active_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint profiles_email_uq unique (institution_id, email),
  constraint profiles_institution_id_uq unique (institution_id, id)
);
create index profiles_institution_role_idx on public.profiles (institution_id, role) where deleted_at is null;
create index profiles_department_idx on public.profiles (department_id) where deleted_at is null;

create table public.teacher_private_details (
  teacher_id     uuid primary key references public.profiles(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  phone          text,
  office         text,
  employee_no    text,
  personal_email text,
  bio            text,
  updated_at     timestamptz not null default now(),
  constraint teacher_private_details_institution_id_uq unique (institution_id, teacher_id)
);

create table public.teacher_private_notes (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  owner_teacher_id uuid not null references public.profiles(id) on delete cascade,
  entity_type     text not null check (entity_type in ('student', 'class', 'module', 'session')),
  entity_id       uuid not null,
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index teacher_private_notes_owner_idx on public.teacher_private_notes (owner_teacher_id, created_at desc);

create table public.students (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  profile_id     uuid unique references public.profiles(id) on delete set null,
  student_number text not null,
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text,
  program        text not null,
  year_level     int not null default 1 check (year_level between 1 and 8),
  risk_level     public.risk_level not null default 'healthy',
  search_tsv     tsvector generated always as (
                   to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || student_number)
                 ) stored,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint students_number_uq unique (institution_id, student_number),
  constraint students_email_uq unique (institution_id, email),
  constraint students_institution_id_uq unique (institution_id, id)
);
create index students_search_idx on public.students using gin (search_tsv);
create index students_institution_idx on public.students (institution_id) where deleted_at is null;
create index students_risk_idx on public.students (institution_id, risk_level) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Teaching model
-- MODULE  = subject owned by a teacher (what is taught).
-- CLASS   = cohort/group owned by a teacher (who is taught).
-- A student belongs to exactly one ACTIVE class (partial unique index below).
-- A teacher owns many modules and many classes; a module can be taught to
-- several classes; a class can receive several modules from different teachers.
-- ----------------------------------------------------------------------------
create table public.modules (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  term_id         uuid not null,
  department_id   uuid references public.departments(id) on delete set null,
  owner_teacher_id uuid not null,
  code            text not null,
  title           text not null,
  description     text,
  color           text not null default '#2563EB',
  is_archived     boolean not null default false,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint modules_code_uq unique (institution_id, term_id, code),
  constraint modules_institution_id_uq unique (institution_id, id),
  constraint modules_term_fk foreign key (institution_id, term_id) references public.terms(institution_id, id) on delete restrict,
  constraint modules_owner_fk foreign key (institution_id, owner_teacher_id) references public.profiles(institution_id, id) on delete restrict
);
create index modules_owner_idx on public.modules (owner_teacher_id) where deleted_at is null;

create table public.classes (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id) on delete cascade,
  term_id           uuid not null,
  teacher_id        uuid not null,
  department_id     uuid references public.departments(id) on delete set null,
  code              text not null,
  title             text not null,
  description       text,
  room              text,
  color             text not null default '#2563EB',
  expected_students int not null default 0 check (expected_students >= 0),
  is_archived       boolean not null default false,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint classes_code_uq unique (institution_id, term_id, code),
  constraint classes_institution_id_uq unique (institution_id, id),
  constraint classes_term_fk foreign key (institution_id, term_id) references public.terms(institution_id, id) on delete restrict,
  constraint classes_teacher_fk foreign key (institution_id, teacher_id) references public.profiles(institution_id, id) on delete restrict
);
create index classes_teacher_idx on public.classes (teacher_id) where deleted_at is null;
create index classes_term_idx on public.classes (term_id) where deleted_at is null;

create table public.class_modules (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid not null,
  module_id      uuid not null,
  created_at     timestamptz not null default now(),
  constraint class_modules_uq unique (class_id, module_id),
  constraint class_modules_id_class_uq unique (id, class_id),
  constraint class_modules_institution_id_uq unique (institution_id, id),
  constraint class_modules_class_fk foreign key (institution_id, class_id) references public.classes(institution_id, id) on delete cascade,
  constraint class_modules_module_fk foreign key (institution_id, module_id) references public.modules(institution_id, id) on delete cascade
);
create index class_modules_module_idx on public.class_modules (module_id);

create table public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id       uuid not null,
  student_id     uuid not null,
  enrolled_at    timestamptz not null default now(),
  status         text not null default 'active' check (status in ('active', 'dropped', 'completed')),
  deleted_at     timestamptz,
  constraint enrollments_uq unique (class_id, student_id),
  constraint enrollments_class_fk foreign key (institution_id, class_id) references public.classes(institution_id, id) on delete cascade,
  constraint enrollments_student_fk foreign key (institution_id, student_id) references public.students(institution_id, id) on delete cascade
);
-- REQUIREMENT: a student belongs to one class at a time.
create unique index enrollments_one_active_class_per_student_uq
  on public.enrollments (student_id)
  where status = 'active' and deleted_at is null;
create index enrollments_class_active_idx on public.enrollments (class_id) where status = 'active' and deleted_at is null;
create index enrollments_student_idx on public.enrollments (student_id);

-- ----------------------------------------------------------------------------
-- Weekly recurrence rules -> generated session occurrences
-- ----------------------------------------------------------------------------
create table public.schedule_rules (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  class_id        uuid not null,
  class_module_id uuid not null,
  weekday         smallint not null check (weekday between 1 and 7),  -- ISO: 1=Mon
  starts_at_time  time not null,
  ends_at_time    time not null,
  room            text,
  valid_from      date not null,
  valid_until     date not null,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint schedule_rules_time_valid check (ends_at_time > starts_at_time),
  constraint schedule_rules_window_valid check (valid_until >= valid_from),
  constraint schedule_rules_institution_id_uq unique (institution_id, id),
  constraint schedule_rules_class_fk foreign key (institution_id, class_id) references public.classes(institution_id, id) on delete cascade,
  constraint schedule_rules_class_module_fk foreign key (institution_id, class_module_id) references public.class_modules(institution_id, id) on delete cascade,
  -- Guarantees the rule points at a module actually attached to its class.
  constraint schedule_rules_class_module_match_fk
    foreign key (class_module_id, class_id) references public.class_modules(id, class_id) on delete cascade
);
create index schedule_rules_lookup_idx on public.schedule_rules (class_id, weekday) where is_active;
create index schedule_rules_module_idx on public.schedule_rules (class_module_id);

create table public.sessions (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id) on delete cascade,
  class_id          uuid not null,
  class_module_id   uuid,                       -- null = ad-hoc session
  schedule_rule_id  uuid,                       -- null = ad-hoc / replacement
  teacher_id        uuid not null,               -- teacher who actually teaches it
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  room              text,
  status            public.session_status not null default 'scheduled',
  qr_enabled        boolean not null default true,
  opened_at         timestamptz,
  closed_at         timestamptz,
  cancel_reason     text,
  rescheduled_to    uuid references public.sessions(id) on delete set null,
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint sessions_time_valid check (ends_at > starts_at),
  constraint sessions_cancel_reason check (status <> 'cancelled' or cancel_reason is not null),
  constraint sessions_institution_id_uq unique (institution_id, id),
  -- One occurrence per weekly rule slot: regeneration is idempotent.
  constraint sessions_generated_uq unique (schedule_rule_id, starts_at),
  constraint sessions_class_fk foreign key (institution_id, class_id) references public.classes(institution_id, id) on delete cascade,
  constraint sessions_class_module_fk foreign key (institution_id, class_module_id) references public.class_modules(institution_id, id) on delete cascade,
  constraint sessions_teacher_fk foreign key (institution_id, teacher_id) references public.profiles(institution_id, id) on delete restrict
);
create index sessions_class_time_idx on public.sessions (class_id, starts_at desc);
create index sessions_teacher_time_idx on public.sessions (teacher_id, starts_at desc);
create index sessions_institution_status_idx on public.sessions (institution_id, status, starts_at)
  where status in ('scheduled', 'live');

create table public.attendance (
  id                   uuid primary key default gen_random_uuid(),
  institution_id       uuid not null references public.institutions(id) on delete cascade,
  session_id           uuid not null,
  student_id           uuid not null,
  status               public.attendance_status not null,
  late_minutes         int,
  notes                text,                    -- private teacher note
  justification_reason text,
  justification_url    text,                     -- signed Storage path
  source               public.attendance_source not null default 'teacher',
  marked_by            uuid references public.profiles(id) on delete set null,
  marked_at            timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint attendance_uq unique (session_id, student_id),
  constraint attendance_late_minutes check (late_minutes is null or status = 'late'),
  constraint attendance_late_requires_minutes check (status <> 'late' or late_minutes between 1 and 1440),
  constraint attendance_justified_requires_reason check (status <> 'justified' or justification_reason is not null),
  constraint attendance_evidence_only_when_justified check (justification_url is null or status = 'justified'),
  constraint attendance_session_fk foreign key (institution_id, session_id) references public.sessions(institution_id, id) on delete cascade,
  constraint attendance_student_fk foreign key (institution_id, student_id) references public.students(institution_id, id) on delete cascade
);
create index attendance_session_idx on public.attendance (session_id);
create index attendance_student_time_idx on public.attendance (student_id, marked_at desc);
create index attendance_status_idx on public.attendance (institution_id, status) where status in ('late', 'absent', 'justified');

-- Append-only change trail for every attendance insert/update.
create table public.attendance_history (
  id            bigint generated always as identity primary key,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  attendance_id uuid not null,
  session_id    uuid not null,
  student_id    uuid not null,
  actor_id      uuid references public.profiles(id) on delete set null,
  action        text not null check (action in ('insert', 'update')),
  before_data   jsonb,
  after_data    jsonb not null,
  created_at    timestamptz not null default now()
);
create index attendance_history_attendance_idx on public.attendance_history (attendance_id, created_at desc);
create index attendance_history_student_idx on public.attendance_history (student_id, created_at desc);

-- ----------------------------------------------------------------------------
-- QR: opaque random token (192-bit), only SHA-256 hash is stored.
-- TTL is 4 seconds by default. A token may be used by MANY students, but only
-- ONCE per student (qr_token_uses) - screenshots older than 4s are useless.
-- ----------------------------------------------------------------------------
create table public.qr_tokens (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  session_id     uuid not null,
  token_hash     text not null unique,
  nonce          text not null default encode(gen_random_bytes(8), 'hex'),
  issued_by      uuid references public.profiles(id) on delete set null,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),
  constraint qr_tokens_institution_id_uq unique (institution_id, id),
  constraint qr_tokens_session_fk foreign key (institution_id, session_id) references public.sessions(institution_id, id) on delete cascade
);
create index qr_tokens_session_expiry_idx on public.qr_tokens (session_id, expires_at desc);
create index qr_tokens_expiry_idx on public.qr_tokens (expires_at);

create table public.qr_token_uses (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  token_id       uuid not null,
  student_id     uuid not null references public.students(id) on delete cascade,
  used_at        timestamptz not null default now(),
  constraint qr_token_uses_uq unique (token_id, student_id),
  constraint qr_token_uses_token_fk foreign key (institution_id, token_id) references public.qr_tokens(institution_id, id) on delete cascade
);

-- ----------------------------------------------------------------------------
-- Operational / audit tables
-- ----------------------------------------------------------------------------
create table public.session_changes (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  session_id     uuid not null,
  change         public.change_type not null,
  reason         text not null,
  previous       jsonb not null default '{}'::jsonb,
  new_values     jsonb not null default '{}'::jsonb,
  changed_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint session_changes_session_fk foreign key (institution_id, session_id) references public.sessions(institution_id, id) on delete cascade
);
create index session_changes_session_idx on public.session_changes (session_id, created_at desc);

create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  kind           public.notification_kind not null default 'system',
  title          text not null,
  body           text,
  link           text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

create table public.audit_logs (
  id             bigint generated always as identity primary key,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  actor_id       uuid references public.profiles(id) on delete set null,
  action         text not null,
  entity_type    text not null,
  entity_id      uuid,
  before_data    jsonb,
  after_data     jsonb,
  user_agent     text,
  created_at     timestamptz not null default now()
);
create index audit_logs_institution_idx on public.audit_logs (institution_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

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
create index report_exports_requester_idx on public.report_exports (requested_by, created_at desc);

create table public.import_jobs (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id) on delete cascade,
  class_id          uuid references public.classes(id) on delete set null,
  created_by        uuid not null references public.profiles(id) on delete cascade,
  kind              public.import_kind not null,
  status            public.import_status not null default 'staged',
  file_path         text,
  file_name         text,
  model_version     text,
  total_rows        int not null default 0 check (total_rows >= 0),
  valid_rows        int not null default 0 check (valid_rows >= 0),
  warning_rows      int not null default 0 check (warning_rows >= 0),
  error_rows        int not null default 0 check (error_rows >= 0),
  error_report_path text,
  summary           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);
create index import_jobs_owner_idx on public.import_jobs (created_by, created_at desc);

create table public.timetable_import_drafts (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  import_job_id  uuid not null references public.import_jobs(id) on delete cascade,
  class_id       uuid references public.classes(id) on delete set null,
  raw_response   jsonb,
  extracted_rows jsonb not null default '[]'::jsonb,
  corrections    jsonb not null default '[]'::jsonb,
  status         public.import_status not null default 'review',
  created_at     timestamptz not null default now(),
  committed_at   timestamptz
);

-- ----------------------------------------------------------------------------
-- Trigger helpers
-- ----------------------------------------------------------------------------
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_institutions_updated_at before update on public.institutions
  for each row execute function public.fn_set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.fn_set_updated_at();
create trigger trg_teacher_private_details_updated_at before update on public.teacher_private_details
  for each row execute function public.fn_set_updated_at();
create trigger trg_teacher_private_notes_updated_at before update on public.teacher_private_notes
  for each row execute function public.fn_set_updated_at();
create trigger trg_students_updated_at before update on public.students
  for each row execute function public.fn_set_updated_at();
create trigger trg_modules_updated_at before update on public.modules
  for each row execute function public.fn_set_updated_at();
create trigger trg_classes_updated_at before update on public.classes
  for each row execute function public.fn_set_updated_at();
create trigger trg_schedule_rules_updated_at before update on public.schedule_rules
  for each row execute function public.fn_set_updated_at();
create trigger trg_sessions_updated_at before update on public.sessions
  for each row execute function public.fn_set_updated_at();
create trigger trg_attendance_updated_at before update on public.attendance
  for each row execute function public.fn_set_updated_at();

-- Private tables must be owned by a teacher in the same institution.
create or replace function public.fn_require_teacher_details_owner()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.teacher_id
      and p.institution_id = new.institution_id
      and p.role = 'teacher'
      and p.deleted_at is null
  ) then
    raise exception 'teacher_private_details_owner_invalid' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_teacher_private_details_owner
  before insert or update on public.teacher_private_details
  for each row execute function public.fn_require_teacher_details_owner();

create or replace function public.fn_require_private_note_owner()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.owner_teacher_id
      and p.institution_id = new.institution_id
      and p.role = 'teacher'
      and p.deleted_at is null
  ) then
    raise exception 'teacher_private_note_owner_invalid' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_teacher_private_note_owner
  before insert or update on public.teacher_private_notes
  for each row execute function public.fn_require_private_note_owner();

-- Class and module owners must be real teacher profiles in the same institution.
-- Defence in depth for direct writes (including service-role imports).
create or replace function public.fn_require_teacher_owner()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_teacher_id uuid;
begin
  v_teacher_id := coalesce(
    (to_jsonb(new) ->> 'owner_teacher_id')::uuid,
    (to_jsonb(new) ->> 'teacher_id')::uuid
  );
  if not exists (
    select 1 from public.profiles p
    where p.id = v_teacher_id
      and p.institution_id = new.institution_id
      and p.role = 'teacher'
      and p.deleted_at is null
  ) then
    raise exception 'teacher_owner_must_be_teacher' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_modules_teacher_owner
  before insert or update of owner_teacher_id on public.modules
  for each row execute function public.fn_require_teacher_owner();
create trigger trg_classes_teacher_owner
  before insert or update of teacher_id on public.classes
  for each row execute function public.fn_require_teacher_owner();

-- A session's teacher must be the owner of the module being taught.
create or replace function public.fn_validate_session_teacher()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_module_owner uuid;
begin
  if new.class_module_id is not null then
    select m.owner_teacher_id into v_module_owner
    from public.class_modules cm
    join public.modules m on m.id = cm.module_id
    where cm.id = new.class_module_id;

    if v_module_owner is distinct from new.teacher_id then
      raise exception 'session_teacher_must_match_module_owner' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

create trigger trg_sessions_validate_teacher
  before insert or update of teacher_id, class_module_id on public.sessions
  for each row execute function public.fn_validate_session_teacher();

-- No attendance on cancelled / rescheduled occurrences (defence in depth).
create or replace function public.fn_block_attendance_on_inactive_session()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_status public.session_status;
begin
  select status into v_status from public.sessions where id = new.session_id;
  if v_status in ('cancelled', 'rescheduled') then
    raise exception 'attendance_not_allowed_on_%_session', v_status using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_attendance_session_status
  before insert or update of session_id on public.attendance
  for each row execute function public.fn_block_attendance_on_inactive_session();

-- Append-only attendance history.
create or replace function public.fn_write_attendance_history()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.attendance_history
    (institution_id, attendance_id, session_id, student_id, actor_id, action, before_data, after_data)
  values
    (new.institution_id, new.id, new.session_id, new.student_id, auth.uid(),
     case when tg_op = 'INSERT' then 'insert' else 'update' end,
     case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
     to_jsonb(new));
  return new;
end $$;

create trigger trg_attendance_history
  after insert or update on public.attendance
  for each row execute function public.fn_write_attendance_history();

-- Keep the denormalised risk flag current for dashboards/alerts.
create or replace function public.fn_refresh_student_risk(p_student_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inst uuid;
  v_warn numeric;
  v_crit numeric;
  v_rate numeric;
begin
  select institution_id into v_inst from public.students where id = p_student_id;
  if v_inst is null then return; end if;

  select risk_warning_pct, risk_critical_pct into v_warn, v_crit
  from public.institutions where id = v_inst;

  select public.attendance_rate(
    count(*) filter (where a.status = 'present')::int,
    count(*) filter (where a.status = 'late')::int,
    count(*) filter (where a.status = 'absent')::int
  ) into v_rate
  from public.attendance a
  join public.sessions s on s.id = a.session_id and s.status = 'completed'
  where a.student_id = p_student_id;

  update public.students
     set risk_level = case
       when v_rate is null then 'healthy'
       when v_rate < v_crit then 'critical'
       when v_rate < v_warn then 'at_risk'
       when v_rate < v_warn + 8 then 'watch'
       else 'healthy'
     end
   where id = p_student_id;
end $$;

create or replace function public.fn_attendance_refresh_risk()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.fn_refresh_student_risk(new.student_id);
  return new;
end $$;

create trigger trg_attendance_refresh_risk
  after insert or update of status on public.attendance
  for each row execute function public.fn_attendance_refresh_risk();

-- ----------------------------------------------------------------------------
-- Reporting views. security_invoker = true => caller RLS is respected.
-- ----------------------------------------------------------------------------
create or replace view public.v_class_attendance
with (security_invoker = true) as
select
  c.id as class_id,
  c.institution_id,
  c.teacher_id,
  c.department_id,
  c.code,
  c.title,
  (select count(*)::int from public.enrollments e
     where e.class_id = c.id and e.status = 'active' and e.deleted_at is null) as students,
  (select count(*)::int from public.sessions s
     where s.class_id = c.id and s.status = 'completed') as sessions_held,
  count(a.id)::int as records,
  count(a.id) filter (where a.status = 'present')::int as present_count,
  count(a.id) filter (where a.status = 'late')::int as late_count,
  count(a.id) filter (where a.status = 'absent')::int as absent_count,
  count(a.id) filter (where a.status = 'justified')::int as justified_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.classes c
left join public.sessions s on s.class_id = c.id and s.status = 'completed'
left join public.attendance a on a.session_id = s.id
where c.deleted_at is null
group by c.id;

create or replace view public.v_student_attendance
with (security_invoker = true) as
select
  st.id as student_id,
  st.institution_id,
  st.student_number,
  st.first_name,
  st.last_name,
  st.email,
  st.program,
  st.year_level,
  st.risk_level,
  count(a.id)::int as records,
  count(a.id) filter (where a.status = 'present')::int as present_count,
  count(a.id) filter (where a.status = 'late')::int as late_count,
  count(a.id) filter (where a.status = 'absent')::int as absent_count,
  count(a.id) filter (where a.status = 'justified')::int as justified_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.students st
left join public.attendance a on a.student_id = st.id
left join public.sessions s on s.id = a.session_id
where st.deleted_at is null
  and (a.id is null or s.status = 'completed')
group by st.id;

create or replace view public.v_teacher_performance
with (security_invoker = true) as
with attendance_by_teacher as (
  select
    c.teacher_id,
    count(a.id) filter (where a.status = 'present')::int as present_count,
    count(a.id) filter (where a.status = 'late')::int as late_count,
    count(a.id) filter (where a.status = 'absent')::int as absent_count,
    count(a.id) filter (where a.status = 'justified')::int as justified_count
  from public.classes c
  join public.sessions s on s.class_id = c.id and s.status = 'completed'
  join public.attendance a on a.session_id = s.id
  group by c.teacher_id
)
select
  p.id as teacher_id,
  p.institution_id,
  p.first_name,
  p.last_name,
  p.email,
  p.title,
  d.name as department,
  (select count(*)::int from public.classes c
     where c.teacher_id = p.id and c.deleted_at is null) as classes,
  (select count(distinct e.student_id)::int
     from public.classes c
     join public.enrollments e on e.class_id = c.id
     where c.teacher_id = p.id and e.status = 'active' and e.deleted_at is null) as students,
  coalesce(abt.present_count, 0) as present_count,
  coalesce(abt.late_count, 0) as late_count,
  coalesce(abt.absent_count, 0) as absent_count,
  coalesce(abt.justified_count, 0) as justified_count,
  public.attendance_rate(
    coalesce(abt.present_count, 0),
    coalesce(abt.late_count, 0),
    coalesce(abt.absent_count, 0)
  ) as attendance_rate
from public.profiles p
left join public.departments d on d.id = p.department_id
left join attendance_by_teacher abt on abt.teacher_id = p.id
where p.role = 'teacher' and p.deleted_at is null;

create or replace view public.v_daily_attendance
with (security_invoker = true) as
select
  s.institution_id,
  c.department_id,
  (s.starts_at at time zone i.timezone)::date as day,
  count(a.id) filter (where a.status = 'present')::int as present_count,
  count(a.id) filter (where a.status = 'late')::int as late_count,
  count(a.id) filter (where a.status = 'absent')::int as absent_count,
  count(a.id) filter (where a.status = 'justified')::int as justified_count,
  public.attendance_rate(
    count(a.id) filter (where a.status = 'present')::int,
    count(a.id) filter (where a.status = 'late')::int,
    count(a.id) filter (where a.status = 'absent')::int
  ) as attendance_rate
from public.sessions s
join public.institutions i on i.id = s.institution_id
join public.classes c on c.id = s.class_id
left join public.attendance a on a.session_id = s.id
where s.status = 'completed'
group by s.institution_id, c.department_id, i.timezone, (s.starts_at at time zone i.timezone)::date;

-- Institution-wide KPI view for administrator reports.
create or replace view public.v_institution_summary
with (security_invoker = true) as
select
  i.id as institution_id,
  i.name,
  i.timezone,
  (select count(*)::int from public.profiles p
     where p.institution_id = i.id and p.role = 'teacher' and p.deleted_at is null) as teachers,
  (select count(*)::int from public.students st
     where st.institution_id = i.id and st.deleted_at is null) as students,
  (select count(*)::int from public.classes c
     where c.institution_id = i.id and c.deleted_at is null) as classes,
  (select count(*)::int from public.sessions s
     where s.institution_id = i.id and s.status = 'live') as live_sessions,
  (select public.attendance_rate(
     coalesce(sum(d.present_count), 0)::int,
     coalesce(sum(d.late_count), 0)::int,
     coalesce(sum(d.absent_count), 0)::int
   ) from public.v_daily_attendance d where d.institution_id = i.id) as attendance_rate
from public.institutions i
where i.deleted_at is null;
