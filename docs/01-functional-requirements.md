# ClassTrack — Functional Requirements

**Document version:** 1.0
**Status:** Approved for MVP
**Product:** ClassTrack — University Attendance Management Platform
**Institution (reference tenant):** Northbridge University

---

## 1. Purpose & Scope

ClassTrack is a multi-tenant, web-based attendance management platform for higher-education institutions. It enables teachers to manage classes, rosters, timetables and attendance; administrators to monitor attendance quality across the establishment and export institutional reports; and students to register their presence in a session by scanning a dynamic QR code.

### 1.1 In scope (MVP)

- Role-based access for Teacher, Administrator and Student.
- Class, student and enrollment management.
- Student import: manual entry and Excel (.xlsx/.csv) import.
- Timetable import: manual builder, AI image extraction, AI structured import.
- Automatic current-session detection and live attendance capture.
- Manual attendance marking with lateness tracking.
- Session cancellation and rescheduling.
- Dynamic, rotating QR attendance with anti-fraud controls.
- Attendance analytics and exportable reports for teachers and administrators.
- Teacher profile and notification preferences.

### 1.2 Out of scope (post-MVP)

- Native mobile applications (responsive web only).
- Biometric attendance (face/fingerprint).
- Tuition, grading and LMS content delivery.
- Payroll or HR integrations.
- Offline-first attendance capture (planned for v1.1).

### 1.3 Actors

| Actor | Description | Primary goals |
|---|---|---|
| Teacher | Faculty member who owns one or more classes. | Run sessions, mark attendance, monitor student risk, export class reports. |
| Administrator | Registrar / academic operations staff. | Monitor institution-wide attendance, manage teachers and classes, download reports. |
| Student | Enrolled learner. | Check in to a live session quickly and see their attendance record. |
| System | Scheduled jobs, AI services, Edge Functions. | Detect sessions, rotate QR tokens, compute analytics, send notifications. |

### 1.4 Personas

- **Dr. Amina El Fassi — Teacher, Computer Science.** Teaches 5 classes and 180 students. Needs to start a session in under 30 seconds and spot at-risk students before midterms.
- **Karim Bennis — Administrator.** Oversees 84 teachers and 2,400 students. Needs reliable, comparable attendance data per department and fast report exports for accreditation.
- **Yasmine Ait Ali — Student.** Wants a two-tap check-in without installing an app.

---

## 2. Glossary

| Term | Definition |
|---|---|
| Class / Course | A teaching unit with a code, title, teacher, roster and weekly schedule. |
| Session | A single dated occurrence of a class (e.g., CS-301 on Tue 09:00–10:30). |
| Enrollment | The association between a student and a class. |
| Attendance status | `present`, `late`, `absent`, `excused`. |
| Current session | A session whose start/end window (including grace period) contains the current server time. |
| QR token | Short-lived signed token embedded in the session QR code. |
| Check-in | A student-submitted attendance record validated against a QR token. |
| Attendance rate | Present + late (weighted) ÷ expected attendance opportunities. |

---

## 3. Functional Requirements

Priority: **P0** = must ship, **P1** = should ship, **P2** = could ship.

### 3.1 Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Users sign in with institutional email and password via Supabase Auth; sessions persist across reloads. | P0 |
| FR-AUTH-02 | A user has exactly one active role per tenant: `teacher`, `admin`, or `student`. Roles are stored in `profiles` and enforced by RLS. | P0 |
| FR-AUTH-03 | Users can request a password reset by email. | P0 |
| FR-AUTH-04 | Administrators can invite teachers; invitations expire after 7 days. | P0 |
| FR-AUTH-05 | Sessions expire after 12 hours of inactivity; refresh tokens rotate. | P0 |
| FR-AUTH-06 | MFA (TOTP) is available to administrators. | P1 |
| FR-AUTH-07 | Every privileged mutation is written to an audit log (actor, action, entity, before/after, IP, timestamp). | P0 |

**Acceptance criteria (FR-AUTH-02):** A teacher calling an admin-only endpoint receives HTTP 403; RLS returns zero rows rather than leaking data.

### 3.2 Class Management

| ID | Requirement | Priority |
|---|---|---|
| FR-CLS-01 | Teachers can create a class with code, title, description, academic term, room, color, weekly schedule and expected enrollment. | P0 |
| FR-CLS-02 | Class codes are unique per institution per term. | P0 |
| FR-CLS-03 | Teachers can edit and archive classes. Archiving preserves historical attendance and removes the class from active lists. | P0 |
| FR-CLS-04 | A class detail view shows overview KPIs, roster, upcoming sessions, attendance history and at-risk students. | P0 |
| FR-CLS-05 | Teachers can duplicate a class structure (schedule, settings) into a new term without copying attendance. | P1 |
| FR-CLS-06 | Administrators can view, reassign ownership of, and archive any class. | P0 |
| FR-CLS-07 | Classes display a computed attendance rate, session count and enrollment count. | P0 |

### 3.3 Student Management & Import

| ID | Requirement | Priority |
|---|---|---|
| FR-STU-01 | Teachers can add a student manually with first name, last name, institutional email, student number, program and year. | P0 |
| FR-STU-02 | Student numbers and emails are unique per institution; duplicates are rejected with a clear conflict message. | P0 |
| FR-STU-03 | Teachers can import students from `.xlsx` or `.csv` using a provided template. | P0 |
| FR-STU-04 | The importer maps columns, validates required fields and emails, detects duplicates, and presents a dry-run preview (valid / warning / error rows) before commit. | P0 |
| FR-STU-05 | Import commits are atomic; a failed commit leaves the roster unchanged. | P0 |
| FR-STU-06 | Import results are downloadable as a CSV error report. | P1 |
| FR-STU-07 | Teachers can edit student details, transfer a student between classes, and remove an enrollment without deleting the student record. | P0 |
| FR-STU-08 | Rosters can be searched, filtered (class, year, risk level) and sorted. | P0 |
| FR-STU-09 | Bulk actions support marking risk status, exporting the roster, and adding students to a class. | P1 |
| FR-STU-10 | Importing more than 500 rows requires background processing with progress feedback. | P1 |

### 3.4 Timetable Management & AI Import

| ID | Requirement | Priority |
|---|---|---|
| FR-TT-01 | Teachers can build a weekly timetable manually: weekday, start/end time, room, class and recurrence window. | P0 |
| FR-TT-02 | The timetable view renders a week grid on desktop and an agenda list on narrow screens. | P0 |
| FR-TT-03 | Sessions are generated from the timetable for a selected date range, skipping holidays defined by the institution calendar. | P0 |
| FR-TT-04 | **Image-based AI import:** the teacher uploads a photo/scan/PDF of a timetable; the system extracts candidate entries with confidence scores and shows them for review. | P0 |
| FR-TT-05 | **Structured AI import:** the teacher pastes free text or JSON (e.g., copied from an email or spreadsheet); the system normalizes it into timetable entries. | P0 |
| FR-TT-06 | AI imports never write directly to the schedule. The teacher must review, correct conflicts and confirm. | P0 |
| FR-TT-07 | Conflict detection flags overlapping times, room clashes and entries outside the term. | P0 |
| FR-TT-08 | Every AI extraction stores the source file, model version, raw output and teacher corrections for audit and quality monitoring. | P0 |
| FR-TT-09 | If AI confidence is low, the UI highlights uncertain fields and falls back to manual entry. | P1 |
| FR-TT-10 | Timetable changes after sessions exist require confirmation; future unstarted sessions are regenerated, past sessions are preserved. | P0 |

### 3.5 Session Detection & Lifecycle

| ID | Requirement | Priority |
|---|---|---|
| FR-SES-01 | The system computes the current session server-side from timetable occurrences, timezone and grace window (default: opens 10 min before start, closes 15 min after start). | P0 |
| FR-SES-02 | The teacher dashboard shows a live "current session" card with elapsed time, attendance progress and quick actions. | P0 |
| FR-SES-03 | If two sessions overlap, the teacher sees all live sessions and explicitly selects one. | P0 |
| FR-SES-04 | Sessions move through `scheduled → live → completed` automatically, and can be `cancelled` or `rescheduled`. | P0 |
| FR-SES-05 | A session auto-completes at its end time; unmarked students become `absent` unless the session is cancelled. | P0 |
| FR-SES-06 | Teachers can manually open a session early or close it, with an audit note. | P0 |
| FR-SES-07 | Session state changes are broadcast in real time to connected clients (Supabase Realtime). | P1 |

**Acceptance criteria (FR-SES-01):** Given a session 09:00–10:30 and grace 15 minutes, a check-in at 09:14 succeeds; at 09:16 it is rejected with "check-in window closed".

### 3.6 Attendance & Lateness

| ID | Requirement | Priority |
|---|---|---|
| FR-ATT-01 | The attendance roster lists every enrolled student with a status control: Present, Late, Absent, Excused. | P0 |
| FR-ATT-02 | Late marking captures minutes late; students arriving after the grace period default to Late, after half the session to Absent. | P0 |
| FR-ATT-03 | Teachers can mark all present in one action, then adjust exceptions. | P0 |
| FR-ATT-04 | Attendance can be edited until 24 hours after the session ends (configurable); later edits require administrator approval. | P0 |
| FR-ATT-05 | Each attendance change records actor, timestamp and previous value. | P0 |
| FR-ATT-06 | Excused absence requires a reason and optional supporting document. | P1 |
| FR-ATT-07 | Students can see their own attendance history and rate; they cannot edit it. | P0 |
| FR-ATT-08 | A warning is shown if a student is marked absent in 3 consecutive sessions, and the student is flagged at-risk below 75% attendance. | P0 |
| FR-ATT-09 | Attendance rate calculation: `(present + 0.5 × late) / (present + late + absent)`; excused absences are excluded from the denominator. | P0 |
| FR-ATT-10 | Attendance data can be corrected by administrators with a mandatory reason. | P0 |

### 3.7 Session Cancellation & Rescheduling

| ID | Requirement | Priority |
|---|---|---|
| FR-RES-01 | Teachers can cancel a session with a reason (teacher absence, holiday, room issue, other). | P0 |
| FR-RES-02 | Cancelled sessions do not count as an attendance opportunity and cannot receive check-ins. | P0 |
| FR-RES-03 | Teachers can reschedule a session to a new date/time/room; the original is marked `rescheduled` and linked to the replacement. | P0 |
| FR-RES-04 | Cancellation/reschedule triggers a notification to enrolled students and the administrator digest. | P0 |
| FR-RES-05 | A rescheduled session can be reverted within 24 hours if no attendance exists. | P1 |
| FR-RES-06 | The session history preserves the original schedule and the change reason. | P0 |

### 3.8 Dynamic QR Attendance

| ID | Requirement | Priority |
|---|---|---|
| FR-QR-01 | Starting a session generates a signed QR token that rotates every 20 seconds (configurable 10–60s). | P0 |
| FR-QR-02 | The QR payload contains only a random opaque token; the session ID, timestamp and nonce are validated server-side. | P0 |
| FR-QR-03 | The teacher screen displays the QR, a short manual code, a countdown ring and live check-in count. | P0 |
| FR-QR-04 | A student scans the QR, authenticates, and confirms check-in; the server validates token freshness, enrollment, session window and duplicate check-ins. | P0 |
| FR-QR-05 | Expired, replayed or tampered tokens are rejected with an actionable message. | P0 |
| FR-QR-06 | The QR cannot be used outside the session time window or from a cancelled session. | P0 |
| FR-QR-07 | Teachers can pause/resume QR check-in and close it manually. | P0 |
| FR-QR-08 | Optional network binding: check-ins from more than 500 m from the declared room can be flagged (not blocked). | P2 |
| FR-QR-09 | Teachers can manually add a check-in for a student whose device failed. | P0 |
| FR-QR-10 | The QR page provides a "preview student view" for demonstration and testing. | P1 |

**Acceptance criteria (FR-QR-04):** A token older than 2 rotation periods is rejected; a second check-in by the same student returns "already checked in" without creating a duplicate row.

### 3.9 Reports & Analytics

| ID | Requirement | Priority |
|---|---|---|
| FR-REP-01 | Teacher reports show attendance trend, status distribution, per-student table, per-class comparison and at-risk list for a chosen date range. | P0 |
| FR-REP-02 | Administrators see institution-wide KPIs, attendance by department, teacher/class league table, live sessions and trend comparisons. | P0 |
| FR-REP-03 | Reports can be filtered by term, date range, class, department, teacher and status. | P0 |
| FR-REP-04 | Reports export to CSV; PDF export includes charts and a cover header. | P0 |
| FR-REP-05 | Exports respect the current filters and are logged for audit. | P0 |
| FR-REP-06 | Metrics use the institutional timezone and exclude cancelled sessions. | P0 |
| FR-REP-07 | Charts are accessible: values available in text/table form, not color-only. | P1 |
| FR-REP-08 | Scheduled weekly report emails can be enabled per administrator. | P2 |

### 3.10 Teacher Administration (Admin)

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-01 | Administrators can list, search, filter and sort teachers by department, status, load and attendance performance. | P0 |
| FR-ADM-02 | Administrators can invite, suspend and reactivate teachers. | P0 |
| FR-ADM-03 | The teacher detail view shows classes, total students, attendance rate, last activity and open issues. | P0 |
| FR-ADM-04 | Administrators can reassign a class to another teacher with a reason. | P1 |
| FR-ADM-05 | Administrators can configure institution settings: timezone, term dates, grace period, QR rotation, risk threshold. | P0 |
| FR-ADM-06 | Administrators can monitor live sessions and attendance capture across departments. | P0 |

### 3.11 Notifications & Profile

| ID | Requirement | Priority |
|---|---|---|
| FR-NOT-01 | In-app notifications for session start, low attendance, import completion, invitations and report readiness. | P0 |
| FR-NOT-02 | Email notifications for session cancellation/reschedule and weekly summaries; opt-out per category. | P1 |
| FR-NOT-03 | Users can edit name, phone, office, bio and avatar; email changes require verification. | P0 |
| FR-NOT-04 | Users can change password and view active sessions/devices. | P0 |
| FR-PRO-01 | Teacher profile shows teaching load, classes and this-term attendance summary. | P1 |

---

## 4. Business Rules

1. **One check-in per student per session.** Enforced by a unique constraint.
2. **No attendance on cancelled sessions.** Cancelled sessions are excluded from every denominator.
3. **Late ≠ absent.** Late counts as 0.5 present for rate calculations; the UI shows both raw and weighted rates.
4. **Grace window.** Default opens 10 min before start and closes 15 min after start; configurable per institution.
5. **Auto-absence.** At session end, students without a record are written as `absent` by a scheduled job.
6. **Risk threshold.** A student is `at-risk` below 75% and `critical` below 60% (institution-configurable).
7. **Edit window.** Attendance edits are allowed for 24 h; beyond that, an administrator must approve.
8. **Timetable conflicts.** A teacher cannot be double-booked; room clashes are warnings, not hard blocks.
9. **Deletion is soft.** Classes, students, sessions and attendance use `deleted_at`; nothing is hard-deleted by users.
10. **Time authority.** All windows and rates are computed on the server in the institution timezone; the client clock is never trusted.
11. **Tenant isolation.** Every row carries `institution_id`; RLS enforces isolation.

---

## 5. Permission Matrix

| Capability | Teacher | Admin | Student |
|---|:--:|:--:|:--:|
| View own classes | ✅ | ✅ (all) | — |
| Create / edit classes | ✅ own | ✅ all | — |
| Manage roster | ✅ own | ✅ all | — |
| Import students | ✅ own | ✅ all | — |
| Manage timetable | ✅ own | ✅ all | — |
| Start / close session | ✅ own | ✅ all | — |
| Mark / edit attendance | ✅ own (24 h) | ✅ all | — |
| Cancel / reschedule | ✅ own | ✅ all | — |
| Generate QR | ✅ own live | ✅ all live | — |
| Check in via QR | — | — | ✅ own |
| View own attendance | — | — | ✅ |
| View class reports | ✅ own | ✅ all | — |
| View institution reports | — | ✅ | — |
| Manage teachers | — | ✅ | — |
| Institution settings | — | ✅ | — |

---

## 6. Key User Stories (with acceptance criteria)

### US-01 — Start a session and open QR check-in
*As a teacher, I want to start today's session and display a QR so students can check in.*

- Given a scheduled session starting within the grace window, when I open Attendance, the current session is preselected.
- When I click **Start session**, status becomes `live`, the QR appears and rotates every 20 s.
- The check-in counter increments in real time without a page reload.
- When I close the session, no further check-ins are accepted and unmarked students are marked absent.

### US-02 — Import students from Excel
*As a teacher, I want to import my roster from a spreadsheet.*

- Uploading a valid file shows a preview with counts for valid, warning and error rows.
- Invalid emails block commit and are downloadable as a CSV.
- On commit, the roster updates and a success toast shows the number added/skipped.

### US-03 — Import a timetable from an image
*As a teacher, I want to photograph my timetable and have it converted into sessions.*

- Uploading an image runs OCR/extraction and returns structured rows with confidence.
- Each row is editable; conflicts are flagged in red.
- Confirming writes only the approved rows and records the AI source for audit.

### US-04 — Spot at-risk students
*As a teacher, I want to see students below the attendance threshold.*

- The dashboard lists at-risk students with rate, trend and last absence.
- Clicking a student opens their attendance history.
- I can send a nudge notification from the list.

### US-05 — Monitor the institution
*As an administrator, I want a live view of attendance across departments.*

- The admin dashboard shows today's live sessions, check-ins, overall rate and trend.
- I can filter by department and drill into a teacher or class.
- Exporting produces a CSV matching the visible filters.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | P95 page load < 2.0 s on 4G; dashboard queries < 400 ms; QR validation < 300 ms. |
| Availability | 99.9% monthly uptime; graceful degradation if AI services are down (manual import remains). |
| Scale | 50,000 students, 5,000 classes, 1M attendance rows per tenant; 2,000 concurrent check-ins per minute. |
| Security | TLS 1.3, RLS on all tenant tables, signed short-lived QR tokens, audit logging, OWASP ASVS L2. |
| Privacy | GDPR-aligned retention; students can request their attendance data; PII encrypted at rest. |
| Accessibility | WCAG 2.1 AA: keyboard navigation, focus states, 4.5:1 contrast, semantic tables and labels. |
| Responsiveness | Optimized for 1440/1280 desktop and 768–1024 tablet; usable at 375 px. |
| Localization | English first; date/time and number formatting via `Intl`; French and Arabic planned. |
| Observability | Structured logs, error tracking, uptime checks, AI extraction quality dashboard. |
| Backup | Daily automated backups, 30-day PITR. |

---

## 8. Assumptions & Dependencies

- The institution has a stable internet connection in classrooms.
- Students have smartphones with cameras and an authenticated account.
- Academic calendar and holidays are provided by the administrator.
- AI extraction uses a third-party vision model; costs are metered per page.
- Email delivery uses a transactional provider (e.g., Resend/Postmark).

## 9. Open Questions

1. Should late arrival automatically become absent after 50% of session duration? (Proposed: yes, configurable.)
2. Do excused absences require administrator approval or teacher discretion? (Proposed: teacher, audited.)
3. Is student geolocation allowed under institutional policy? (Deferred to v1.1.)
4. Retention period for timetable source images? (Proposed: 12 months.)
