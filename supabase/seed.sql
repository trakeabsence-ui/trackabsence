-- ============================================================================
-- ClassTrack · LOCAL DEVELOPMENT SEED (supabase db reset)
-- Apply order: 0001 core -> 0002 functions -> 0003 RLS -> this file.
-- Demo password for every seeded user: DemoPass123!
-- This file is intentionally NOT a migration: production data stays untouched.
-- ============================================================================

set local search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- Institution, departments, term, holidays
-- ----------------------------------------------------------------------------
insert into public.institutions
  (id, name, slug, timezone, checkin_opens_minutes_before, checkin_closes_minutes_after,
   late_after_minutes, qr_token_ttl_seconds, attendance_edit_hours,
   risk_warning_pct, risk_critical_pct)
values
  ('11111111-1111-4111-8111-111111111111', 'Northbridge University', 'northbridge',
   'Africa/Casablanca', 10, 15, 5, 4, 24, 75.00, 60.00)
on conflict (id) do nothing;

insert into public.departments (id, institution_id, name, code) values
  ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Computer Science', 'CS'),
  ('21111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'Engineering', 'ENG'),
  ('21111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 'Mathematics', 'MTH')
on conflict (id) do nothing;

insert into public.terms (id, institution_id, name, starts_on, ends_on, is_active) values
  ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   'Fall 2026', date '2026-09-01', date '2026-12-20', true)
on conflict (id) do nothing;

insert into public.holidays (institution_id, name, holiday_date) values
  ('11111111-1111-4111-8111-111111111111', 'University closed', date '2026-11-18')
on conflict (institution_id, holiday_date) do nothing;

-- ----------------------------------------------------------------------------
-- Auth users (local only). Passwords are bcrypt-hashed with pgcrypto.
-- ----------------------------------------------------------------------------
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'amina.elfassi@northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Amina', 'last_name', 'El Fassi', 'role', 'teacher'), now(), now()),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'daniel.okafor@northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Daniel', 'last_name', 'Okafor', 'role', 'teacher'), now(), now()),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'karim.bennis@northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Karim', 'last_name', 'Bennis', 'role', 'admin'), now(), now()),
  ('50000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'yasmine.aitoli@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Yasmine', 'last_name', 'Ait Ali', 'role', 'student'), now(), now()),
  ('50000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'omar.benjelloun@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Omar', 'last_name', 'Benjelloun', 'role', 'student'), now(), now()),
  ('50000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'fatima.idrissi@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Fatima Zahra', 'last_name', 'Idrissi', 'role', 'student'), now(), now()),
  ('50000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sara.cohen@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Sara', 'last_name', 'Cohen', 'role', 'student'), now(), now()),
  ('50000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'nour.cherkaoui@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Nour', 'last_name', 'Cherkaoui', 'role', 'student'), now(), now()),
  ('50000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mehdi.alaoui@student.northbridge.edu',
   crypt('DemoPass123!', gen_salt('bf')), now(),
   jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                      'institution_id', '11111111-1111-4111-8111-111111111111'),
   jsonb_build_object('first_name', 'Mehdi', 'last_name', 'Alaoui', 'role', 'student'), now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
select
  u.id, u.id, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now()
from auth.users u
where u.id in (
  '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000006'
)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Profiles (public directory fields; private fields go to the tables below)
-- ----------------------------------------------------------------------------
insert into public.profiles
  (id, institution_id, role, first_name, last_name, email, title, department_id, status)
values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'teacher',
   'Amina', 'El Fassi', 'amina.elfassi@northbridge.edu', 'Associate Professor',
   '21111111-1111-4111-8111-111111111111', 'active'),
  ('40000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'teacher',
   'Daniel', 'Okafor', 'daniel.okafor@northbridge.edu', 'Professor',
   '21111111-1111-4111-8111-111111111113', 'active'),
  ('40000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'admin',
   'Karim', 'Bennis', 'karim.bennis@northbridge.edu', 'Academic Operations Administrator',
   null, 'active'),
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'student',
   'Yasmine', 'Ait Ali', 'yasmine.aitoli@student.northbridge.edu', null, null, 'active'),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'student',
   'Omar', 'Benjelloun', 'omar.benjelloun@student.northbridge.edu', null, null, 'active'),
  ('50000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'student',
   'Fatima Zahra', 'Idrissi', 'fatima.idrissi@student.northbridge.edu', null, null, 'active'),
  ('50000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'student',
   'Sara', 'Cohen', 'sara.cohen@student.northbridge.edu', null, null, 'active'),
  ('50000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'student',
   'Nour', 'Cherkaoui', 'nour.cherkaoui@student.northbridge.edu', null, null, 'active'),
  ('50000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'student',
   'Mehdi', 'Alaoui', 'mehdi.alaoui@student.northbridge.edu', null, null, 'active')
on conflict (id) do nothing;

insert into public.teacher_private_details (teacher_id, institution_id, phone, office, employee_no, bio) values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   '+212 6 61 24 88 10', 'B-210, Bennett Hall', 'NB-FAC-0184',
   'Distributed systems and learning analytics researcher.'),
  ('40000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   '+212 6 63 11 07 42', 'A-118, Science Hall', 'NB-FAC-0207',
   'Applied mathematics and numerical methods.')
on conflict (teacher_id) do nothing;

-- ----------------------------------------------------------------------------
-- Students (institutional email + number unique per institution)
-- ----------------------------------------------------------------------------
insert into public.students
  (id, institution_id, profile_id, student_number, first_name, last_name, email, program, year_level)
values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000001', 'NB-2026-1001', 'Yasmine', 'Ait Ali', 'yasmine.aitoli@student.northbridge.edu', 'BSc Computer Science', 2),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000002', 'NB-2026-1002', 'Omar', 'Benjelloun', 'omar.benjelloun@student.northbridge.edu', 'BSc Computer Science', 2),
  ('50000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000003', 'NB-2026-1003', 'Fatima Zahra', 'Idrissi', 'fatima.idrissi@student.northbridge.edu', 'BSc Software Engineering', 3),
  ('50000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000004', 'NB-2026-1004', 'Sara', 'Cohen', 'sara.cohen@student.northbridge.edu', 'BSc Software Engineering', 2),
  ('50000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000005', 'NB-2026-1005', 'Nour', 'Cherkaoui', 'nour.cherkaoui@student.northbridge.edu', 'BSc Mathematics', 2),
  ('50000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000006', 'NB-2026-1006', 'Mehdi', 'Alaoui', 'mehdi.alaoui@student.northbridge.edu', 'BSc Mathematics', 3)
on conflict (institution_id, student_number) do nothing;

insert into public.teacher_private_notes
  (institution_id, owner_teacher_id, entity_type, entity_id, body)
select '11111111-1111-4111-8111-111111111111',
       '40000000-0000-4000-8000-000000000001', 'student', s.id,
       'Follow up after repeated late arrivals; private note, not visible to other teachers.'
from public.students s
where s.student_number = 'NB-2026-1002'
  and not exists (
    select 1 from public.teacher_private_notes n
    where n.owner_teacher_id = '40000000-0000-4000-8000-000000000001'
      and n.entity_id = s.id
  );

-- ----------------------------------------------------------------------------
-- Modules (teacher-owned subjects) and classes (teacher-owned cohorts)
-- ----------------------------------------------------------------------------
insert into public.modules
  (id, institution_id, term_id, department_id, owner_teacher_id, code, title, description, color)
values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111',
   '40000000-0000-4000-8000-000000000001', 'CS-301', 'Advanced Data Structures',
   'Trees, graphs, heaps and algorithm analysis.', '#2563EB'),
  ('60000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111',
   '40000000-0000-4000-8000-000000000001', 'CS-305', 'Database Systems',
   'Relational modelling, SQL, transactions and indexing.', '#7C3AED'),
  ('60000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111113',
   '40000000-0000-4000-8000-000000000002', 'MTH-204', 'Linear Algebra II',
   'Vector spaces, eigenvalues and numerical methods.', '#0D9488')
on conflict (id) do nothing;

insert into public.classes
  (id, institution_id, term_id, teacher_id, department_id, code, title, room, expected_students, color)
values
  ('70000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000001',
   '21111111-1111-4111-8111-111111111111', 'CS-301-A', 'Advanced Data Structures · Group A',
   'B-204', 42, '#2563EB'),
  ('70000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000001',
   '21111111-1111-4111-8111-111111111111', 'CS-305-B', 'Database Systems · Group B',
   'Lab C-112', 38, '#7C3AED'),
  ('70000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   '31111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000002',
   '21111111-1111-4111-8111-111111111113', 'MTH-204-C', 'Linear Algebra II · Group C',
   'A-118', 30, '#0D9488')
on conflict (id) do nothing;

insert into public.class_modules (id, institution_id, class_id, module_id) values
  ('71000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001'),
  ('71000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003'),
  ('71000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002'),
  ('71000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

-- One active class per student (enforced by partial unique index).
insert into public.enrollments (institution_id, class_id, student_id) values
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000004'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000005'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000006')
on conflict (class_id, student_id) do nothing;

-- ----------------------------------------------------------------------------
-- Weekly recurrence rules -> generated sessions
-- ----------------------------------------------------------------------------
insert into public.schedule_rules
  (id, institution_id, class_id, class_module_id, weekday, starts_at_time, ends_at_time, room, valid_from, valid_until)
values
  ('80000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 2, time '09:00', time '10:30', 'B-204', date '2026-09-01', date '2026-12-20'),
  ('80000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 4, time '09:00', time '10:30', 'B-204', date '2026-09-01', date '2026-12-20'),
  ('80000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000002', 3, time '14:00', time '15:30', 'A-118', date '2026-09-01', date '2026-12-20'),
  ('80000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000003', 1, time '11:00', time '12:30', 'Lab C-112', date '2026-09-01', date '2026-12-20'),
  ('80000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000004', 5, time '10:00', time '11:30', 'A-118', date '2026-09-01', date '2026-12-20')
on conflict (id) do nothing;

select public.rpc_generate_sessions('70000000-0000-4000-8000-000000000001', date '2026-11-23', date '2026-11-27');
select public.rpc_generate_sessions('70000000-0000-4000-8000-000000000002', date '2026-11-23', date '2026-11-27');
select public.rpc_generate_sessions('70000000-0000-4000-8000-000000000003', date '2026-11-23', date '2026-11-27');

-- Demonstrate lifecycle states around "today" (Thu 26 Nov 2026).
update public.sessions
   set status = 'live', opened_at = starts_at + interval '2 minutes'
 where class_id = '70000000-0000-4000-8000-000000000001'
   and starts_at = timestamp '2026-11-26 09:00' at time zone 'Africa/Casablanca';

update public.sessions
   set status = 'completed', closed_at = ends_at, qr_enabled = false
 where class_id = '70000000-0000-4000-8000-000000000001'
   and starts_at = timestamp '2026-11-24 09:00' at time zone 'Africa/Casablanca';

update public.sessions
   set status = 'completed', closed_at = ends_at, qr_enabled = false
 where class_id = '70000000-0000-4000-8000-000000000002'
   and starts_at = timestamp '2026-11-23 11:00' at time zone 'Africa/Casablanca';

-- Attendance examples: present, late (+ minutes + teacher note), justified, absent.
insert into public.attendance
  (institution_id, session_id, student_id, status, late_minutes, notes, source, marked_by)
select
  s.institution_id, s.id, e.student_id,
  case when row_number() over (order by st.student_number) = 1 then 'present'::public.attendance_status
       else 'late'::public.attendance_status end,
  case when row_number() over (order by st.student_number) = 1 then null else 7 end,
  case when row_number() over (order by st.student_number) = 1 then null else 'Arrived after the grace window.' end,
  'teacher', '40000000-0000-4000-8000-000000000001'
from public.sessions s
join public.enrollments e on e.class_id = s.class_id and e.status = 'active'
join public.students st on st.id = e.student_id
where s.class_id = '70000000-0000-4000-8000-000000000001'
  and s.starts_at = timestamp '2026-11-24 09:00' at time zone 'Africa/Casablanca'
on conflict (session_id, student_id) do nothing;

insert into public.attendance
  (institution_id, session_id, student_id, status, justification_reason, source, marked_by)
select
  s.institution_id, s.id, e.student_id,
  case when row_number() over (order by st.student_number) = 1 then 'present'::public.attendance_status
       else 'justified'::public.attendance_status end,
  case when row_number() over (order by st.student_number) = 1 then null else 'Medical certificate provided.' end,
  'teacher', '40000000-0000-4000-8000-000000000001'
from public.sessions s
join public.enrollments e on e.class_id = s.class_id and e.status = 'active'
join public.students st on st.id = e.student_id
where s.class_id = '70000000-0000-4000-8000-000000000002'
  and s.starts_at = timestamp '2026-11-23 11:00' at time zone 'Africa/Casablanca'
on conflict (session_id, student_id) do nothing;

-- A cancelled occurrence (excluded from every denominator).
insert into public.sessions
  (institution_id, class_id, class_module_id, teacher_id, starts_at, ends_at, room, status, cancel_reason)
values
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001',
   '71000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
   timestamp '2026-11-19 09:00' at time zone 'Africa/Casablanca',
   timestamp '2026-11-19 10:30' at time zone 'Africa/Casablanca',
   'B-204', 'cancelled', 'Public holiday')
on conflict do nothing;

insert into public.notifications (institution_id, user_id, kind, title, body, link) values
  ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000001',
   'session', 'CS-301-A is live', 'QR check-in is open until 09:15.', '/teacher/attendance'),
  ('11111111-1111-4111-8111-111111111111', '40000000-0000-4000-8000-000000000003',
   'report', 'Weekly attendance report ready', 'Week 48 institution summary is available.', '/admin/reports');
