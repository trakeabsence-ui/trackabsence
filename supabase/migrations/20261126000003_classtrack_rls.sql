-- ============================================================================
-- ClassTrack · 0003 Row Level Security + grants + realtime publication
-- Boundary rules:
--   * Every tenant table is filtered by current_institution_id().
--   * Teachers only manage classes/modules/sessions they own or teach.
--   * Teacher private fields live in separate tables (owner + admin only).
--   * Students can READ their own attendance, never WRITE it (no policy, no grant).
--   * QR token tables have no client policies at all: RPCs + service role only.
-- ============================================================================

alter table public.institutions            enable row level security;
alter table public.departments             enable row level security;
alter table public.terms                   enable row level security;
alter table public.holidays                enable row level security;
alter table public.profiles                enable row level security;
alter table public.teacher_private_details enable row level security;
alter table public.teacher_private_notes   enable row level security;
alter table public.students                enable row level security;
alter table public.modules                 enable row level security;
alter table public.classes                 enable row level security;
alter table public.class_modules           enable row level security;
alter table public.enrollments             enable row level security;
alter table public.schedule_rules          enable row level security;
alter table public.sessions                enable row level security;
alter table public.attendance              enable row level security;
alter table public.attendance_history      enable row level security;
alter table public.qr_tokens               enable row level security;
alter table public.qr_token_uses           enable row level security;
alter table public.session_changes         enable row level security;
alter table public.notifications           enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.report_exports          enable row level security;
alter table public.import_jobs             enable row level security;
alter table public.timetable_import_drafts enable row level security;

-- ----------------------------------------------------------------------------
-- Institution & academic calendar
-- ----------------------------------------------------------------------------
create policy institutions_select on public.institutions for select to authenticated
  using (id = public.current_institution_id());

create policy institutions_update on public.institutions for update to authenticated
  using (id = public.current_institution_id() and public.is_admin())
  with check (id = public.current_institution_id() and public.is_admin());

create policy departments_select on public.departments for select to authenticated
  using (institution_id = public.current_institution_id() and deleted_at is null);

create policy departments_admin_all on public.departments for all to authenticated
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

create policy terms_select on public.terms for select to authenticated
  using (institution_id = public.current_institution_id());

create policy terms_admin_all on public.terms for all to authenticated
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

create policy holidays_select on public.holidays for select to authenticated
  using (institution_id = public.current_institution_id());

create policy holidays_admin_all on public.holidays for all to authenticated
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

-- ----------------------------------------------------------------------------
-- Profiles table: self or admin only. Other members use v_user_directory below,
-- which deliberately exposes no private fields or performance aggregates.
-- Column privileges (at the end of this file) prevent role/institution escalation.
-- ----------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (
    deleted_at is null
    and (
      id = auth.uid()
      or (institution_id = public.current_institution_id() and public.is_admin())
    )
  );

create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() and institution_id = public.current_institution_id())
  with check (id = auth.uid() and institution_id = public.current_institution_id());

create policy profiles_admin_all on public.profiles for all to authenticated
  using (institution_id = public.current_institution_id() and public.is_admin())
  with check (institution_id = public.current_institution_id() and public.is_admin());

-- Teacher private details: owner or administrator. Other teachers see NOTHING.
create policy teacher_private_details_select on public.teacher_private_details for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())));

create policy teacher_private_details_insert on public.teacher_private_details for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())));

create policy teacher_private_details_update on public.teacher_private_details for update to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())));

create policy teacher_private_notes_select on public.teacher_private_notes for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())));

create policy teacher_private_notes_insert on public.teacher_private_notes for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())));

create policy teacher_private_notes_update on public.teacher_private_notes for update to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())));

-- ----------------------------------------------------------------------------
-- Students: teacher of an enrolled class / admin / the student themself.
-- No student write policy exists: students cannot edit their record here.
-- ----------------------------------------------------------------------------
create policy students_select on public.students for select to authenticated
  using (
    institution_id = public.current_institution_id()
    and deleted_at is null
    and (
      public.is_admin()
      or profile_id = auth.uid()
      or public.teacher_owns_student(id)
    )
  );

create policy students_insert on public.students for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or public.is_teacher()));

create policy students_update on public.students for update to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or public.teacher_owns_student(id)))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or public.teacher_owns_student(id)));

-- ----------------------------------------------------------------------------
-- Modules & classes: strict ownership
-- ----------------------------------------------------------------------------
create policy modules_select on public.modules for select to authenticated
  using (institution_id = public.current_institution_id()
         and deleted_at is null
         and public.can_view_module(id));

create policy modules_insert on public.modules for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())));

create policy modules_update on public.modules for update to authenticated
  using (public.owns_module(id))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and owner_teacher_id = auth.uid())));

create policy classes_select on public.classes for select to authenticated
  using (institution_id = public.current_institution_id()
         and deleted_at is null
         and public.can_view_class(id));

create policy classes_insert on public.classes for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())));

create policy classes_update on public.classes for update to authenticated
  using (public.can_manage_class(id))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and teacher_id = auth.uid())));

create policy class_modules_select on public.class_modules for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.can_view_class(class_id) or public.owns_module(module_id)));

create policy class_modules_write on public.class_modules for all to authenticated
  using (public.is_admin() or public.can_manage_class(class_id))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin()
                   or (public.is_teacher() and public.can_manage_class(class_id))));

-- ----------------------------------------------------------------------------
-- Enrollment: one active class per student; only class owner/admin may change.
-- ----------------------------------------------------------------------------
create policy enrollments_select on public.enrollments for select to authenticated
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or public.can_manage_class(class_id)
      or exists (
        select 1 from public.students st
        where st.id = enrollments.student_id and st.profile_id = auth.uid()
      )
    )
  );

create policy enrollments_insert on public.enrollments for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or public.can_manage_class(class_id)));

create policy enrollments_update on public.enrollments for update to authenticated
  using (public.is_admin() or public.can_manage_class(class_id))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or public.can_manage_class(class_id)));

create policy enrollments_delete on public.enrollments for delete to authenticated
  using (public.is_admin() or public.can_manage_class(class_id));

-- ----------------------------------------------------------------------------
-- Timetable rules & generated sessions
-- ----------------------------------------------------------------------------
create policy schedule_rules_select on public.schedule_rules for select to authenticated
  using (institution_id = public.current_institution_id()
         and public.can_view_class(class_id));

create policy schedule_rules_write on public.schedule_rules for all to authenticated
  using (public.can_manage_schedule_rule(class_id, class_module_id))
  with check (institution_id = public.current_institution_id()
              and public.can_manage_schedule_rule(class_id, class_module_id));

create policy sessions_select on public.sessions for select to authenticated
  using (institution_id = public.current_institution_id()
         and public.can_view_session(id));

-- Lifecycle is RPC-only; this policy exists for service-role completeness.
create policy sessions_write on public.sessions for all to authenticated
  using (public.can_manage_session(id))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin()
                   or (public.is_teacher() and teacher_id = auth.uid())
                   or public.can_manage_class(class_id)));

-- ----------------------------------------------------------------------------
-- Attendance: READ for teacher/class owner/admin/own student; WRITE via RPC only.
-- ----------------------------------------------------------------------------
create policy attendance_select on public.attendance for select to authenticated
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.sessions s
        where s.id = attendance.session_id and public.can_manage_session(s.id)
      )
      or exists (
        select 1 from public.students st
        where st.id = attendance.student_id and st.profile_id = auth.uid()
      )
    )
  );

create policy attendance_history_select on public.attendance_history for select to authenticated
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.sessions s
        where s.id = attendance_history.session_id and public.can_manage_session(s.id)
      )
      or exists (
        select 1 from public.students st
        where st.id = attendance_history.student_id and st.profile_id = auth.uid()
      )
    )
  );

create policy session_changes_select on public.session_changes for select to authenticated
  using (institution_id = public.current_institution_id()
         and public.can_view_session(session_id));

-- qr_tokens / qr_token_uses intentionally have NO policies (definer RPCs only).

-- ----------------------------------------------------------------------------
-- Notifications, audit, exports, imports
-- ----------------------------------------------------------------------------
create policy notifications_select on public.notifications for select to authenticated
  using (institution_id = public.current_institution_id() and user_id = auth.uid());

create policy notifications_update on public.notifications for update to authenticated
  using (institution_id = public.current_institution_id() and user_id = auth.uid())
  with check (institution_id = public.current_institution_id() and user_id = auth.uid());

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (institution_id = public.current_institution_id() and public.is_admin());

create policy report_exports_select on public.report_exports for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or requested_by = auth.uid()));

create policy report_exports_insert on public.report_exports for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or requested_by = auth.uid()));

create policy import_jobs_select on public.import_jobs for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or created_by = auth.uid()));

create policy import_jobs_insert on public.import_jobs for insert to authenticated
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or (public.is_teacher() and created_by = auth.uid())));

create policy import_jobs_update on public.import_jobs for update to authenticated
  using (institution_id = public.current_institution_id()
         and (public.is_admin() or created_by = auth.uid()))
  with check (institution_id = public.current_institution_id()
              and (public.is_admin() or created_by = auth.uid()));

create policy timetable_import_drafts_select on public.timetable_import_drafts for select to authenticated
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.import_jobs j
        where j.id = timetable_import_drafts.import_job_id and j.created_by = auth.uid()
      )
    )
  );

create policy timetable_import_drafts_insert on public.timetable_import_drafts for insert to authenticated
  with check (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.import_jobs j
      where j.id = timetable_import_drafts.import_job_id
        and (j.created_by = auth.uid() or public.is_admin())
    )
  );

create policy timetable_import_drafts_update on public.timetable_import_drafts for update to authenticated
  using (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.import_jobs j
        where j.id = timetable_import_drafts.import_job_id and j.created_by = auth.uid()
      )
    )
  )
  with check (
    institution_id = public.current_institution_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.import_jobs j
        where j.id = timetable_import_drafts.import_job_id and j.created_by = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- Public directory view. The profiles TABLE itself is restricted to self/admin;
-- this definer view exposes only non-sensitive columns to institution members.
-- ----------------------------------------------------------------------------
create or replace view public.v_user_directory
with (security_barrier = true) as
select
  p.id, p.institution_id, p.role, p.first_name, p.last_name,
  p.title, p.department_id, p.avatar_url, p.status
from public.profiles p
where p.deleted_at is null
  and p.institution_id = public.current_institution_id();

-- ----------------------------------------------------------------------------
-- Privileges. Start from zero for anon/authenticated, then allow explicitly.
-- ----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;

grant select on
  public.institutions, public.departments, public.terms, public.holidays,
  public.profiles, public.teacher_private_details, public.teacher_private_notes,
  public.students, public.modules, public.classes, public.class_modules,
  public.enrollments, public.schedule_rules, public.sessions,
  public.attendance, public.attendance_history, public.session_changes,
  public.notifications, public.audit_logs, public.report_exports,
  public.import_jobs, public.timetable_import_drafts
to authenticated;

-- Self-service profile fields only: role / institution / status are NOT writable.
grant update (first_name, last_name, title, avatar_url, department_id) on public.profiles to authenticated;

grant insert, update on public.teacher_private_details to authenticated;
grant insert, update on public.teacher_private_notes to authenticated;
grant insert, update on public.students to authenticated;
grant insert, update on public.modules to authenticated;
grant insert, update on public.classes to authenticated;
grant insert, update, delete on public.class_modules to authenticated;
grant insert, update, delete on public.enrollments to authenticated;
grant insert, update on public.schedule_rules to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert on public.report_exports to authenticated;
grant insert, update on public.import_jobs to authenticated;
grant insert, update on public.timetable_import_drafts to authenticated;

-- Reporting views inherit the caller's RLS.
grant select on
  public.v_user_directory, public.v_class_attendance, public.v_student_attendance,
  public.v_teacher_performance, public.v_daily_attendance,
  public.v_institution_summary
to authenticated;

-- No client privileges at all on QR token tables.
-- Attendance / history / audit / session_changes are SELECT-only (never granted
-- INSERT/UPDATE/DELETE to authenticated); all writes go through definer RPCs.
revoke all on public.qr_tokens from anon, authenticated;
revoke all on public.qr_token_uses from anon, authenticated;

-- ----------------------------------------------------------------------------
-- Realtime: publish only the tables the UI needs for live counters/state.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions'
    ) then
      alter publication supabase_realtime add table public.sessions;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendance'
    ) then
      alter publication supabase_realtime add table public.attendance;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;
