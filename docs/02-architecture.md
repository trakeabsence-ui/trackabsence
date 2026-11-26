# ClassTrack — Application Architecture

**Document version:** 1.0
**Architecture style:** Serverless, modular monolith on Supabase + React SPA
**Target:** Higher-education institutions (multi-tenant SaaS)

---

## 1. Architecture Overview

ClassTrack is a multi-tenant SaaS application composed of four runtime layers:

1. **Web client** — React 19 + Vite single-page application, responsive for desktop and tablet.
2. **Backend platform** — Supabase: PostgreSQL, Auth, Row Level Security, Storage, Realtime, Edge Functions.
3. **AI services** — OCR/vision extraction and structured normalization for timetable imports, invoked only from Edge Functions.
4. **Async workers** — scheduled SQL jobs (pg_cron) and Edge Functions for session lifecycle, auto-absence, notifications and analytics rollups.

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Client (React SPA / Vite)                      │
│  Teacher app · Admin app · Student check-in · Auth · Design system    │
└───────────────┬───────────────────────────────┬───────────────────────┘
                │ HTTPS / WSS                   │
┌───────────────▼───────────────────────────────▼───────────────────────┐
│                           Supabase Platform                           │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ Auth (JWT) │  │ PostgREST    │  │ Realtime    │  │ Storage      │  │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  │
│        │                │                 │                │          │
│  ┌─────▼────────────────▼─────────────────▼────────────────▼───────┐  │
│  │                    PostgreSQL + RLS (single source of truth)     │  │
│  │  profiles · classes · students · enrollments · sessions          │  │
│  │  attendance · qr_tokens · timetable_entries · reports · audit    │  │
│  └─────────────┬───────────────────────────────┬───────────────────┘  │
│                │                               │                      │
│  ┌─────────────▼────────────┐    ┌─────────────▼───────────────────┐  │
│  │ Edge Functions (Deno)    │    │ pg_cron jobs                    │  │
│  │ checkin · qr · ai-import │    │ session sweep · absence sweep   │  │
│  │ reports · invites        │    │ analytics rollup · reminders    │  │
│  └─────────────┬────────────┘    └─────────────────────────────────┘  │
└────────────────┼──────────────────────────────────────────────────────┘
                 │
     ┌───────────▼────────────┐   ┌───────────────────────────┐
     │ Vision/LLM provider    │   │ Transactional email       │
     │ (timetable extraction) │   │ (Resend / Postmark)       │
     └────────────────────────┘   └───────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI | React 19, Vite 8 | Fast HMR, minimal runtime, strong ecosystem. |
| Styling | Design tokens in CSS + component classes | Zero runtime CSS-in-JS, easy theming, predictable bundle. |
| State/data | TanStack Query (server state) + local React state | Cache, retries, optimistic updates for attendance. |
| Routing | React Router (production) / hash router (prototype) | Deep links and role-aware layouts. |
| Backend | Supabase Postgres 15 | Managed Postgres, RLS, realtime, storage. |
| Auth | Supabase Auth (email/password, TOTP MFA) | JWT integrated with RLS; invitation flows. |
| Realtime | Supabase Realtime (Postgres changes + broadcast) | Live check-in counters and session state. |
| Files | Supabase Storage (private buckets) | Roster imports, timetable images, avatars, report exports. |
| Server logic | Supabase Edge Functions (Deno/TypeScript) | Signed QR validation, AI orchestration, privileged reports. |
| Scheduled jobs | pg_cron + pg_net | Session sweep every minute, absence sweep at end. |
| AI | Vision LLM + JSON schema validation (Zod) | Handles photographed timetables and free text. |
| Email | Resend | Transactional notifications. |
| Hosting | Vercel/Netlify for SPA; Supabase cloud | Global CDN, preview deploys, simple ops. |
| Observability | Sentry + Supabase logs + uptime monitor | Error tracking and query performance. |

---

## 3. Frontend Architecture

### 3.1 Folder structure

```
src/
├── main.jsx                 # bootstrap
├── App.jsx                  # providers, router, role layouts
├── index.css                # design system tokens + components
├── data/mockData.js         # demo dataset (replaced by API in production)
├── components/
│   ├── Icons.jsx            # inline SVG icon set
│   ├── ui.jsx               # Button, Badge, Avatar, StatCard, Modal, Toast…
│   ├── Charts.jsx           # dependency-free SVG charts
│   ├── Layout.jsx           # sidebar, topbar, page header, shell
│   └── …
├── pages/
│   ├── Login.jsx
│   ├── CheckIn.jsx          # public student QR landing
│   ├── teacher/             # dashboard, classes, students, timetable…
│   └── admin/               # dashboard, teachers, monitoring, reports
└── lib/
    ├── supabase.js          # typed client (production)
    ├── queries/             # TanStack Query hooks (production)
    └── format.js            # date/number/percent helpers
```

### 3.2 Rendering and routing

- Single-page app with a persistent application shell.
- Role-scoped route trees: `/teacher/*`, `/admin/*`, `/student/*`.
- Guards resolve the session + role before rendering; unauthorized users are redirected.
- Layouts adapt: sidebar on desktop, off-canvas drawer below 1100 px.
- Data-heavy pages use URL search params for filters (shareable views).

### 3.3 State management

| State | Tool |
|---|---|
| Session/user | Supabase Auth context |
| Server data (classes, rosters, reports) | TanStack Query, keyed by resource + filters |
| Live session/check-ins | Supabase Realtime subscription + query cache invalidation |
| Local UI (modals, filters, drafts) | React `useState` / `useReducer` |
| Design tokens/theme | CSS custom properties |

### 3.4 Component strategy

- **Primitives:** Button, Input, Select, Badge, Avatar, Modal, Tooltip, Toast.
- **Data display:** DataTable (sort, filter, pagination, bulk select), StatCard, Progress, EmptyState.
- **Charts:** accessible SVG line/bar/donut/heatmap components with text summaries.
- **Domain:** SessionCard, AttendanceRow, ClassCard, QRPanel, ImportWizard, RiskBadge.

All screens reuse the same tokens: 8-point spacing, 12–16 px radii, one primary action per view, consistent table density.

---

## 4. Backend Architecture

### 4.1 Supabase services

| Service | Usage |
|---|---|
| Auth | Sign-up by invitation, login, password reset, MFA for admins. JWT carries `sub`, `institution_id`, `role` claims. |
| Postgres | All domain data, constraints, views, materialized analytics. |
| RLS | Tenant + role isolation on every table. No client-side trust. |
| Storage | `avatars` (public read), `imports` (private), `timetables` (private), `reports` (signed URLs). |
| Realtime | `sessions` status changes, `attendance` inserts for live counters, notification badges. |
| Edge Functions | `qr-issue`, `checkin`, `ai-timetable`, `import-students`, `report-export`, `invite-teacher`. |

### 4.2 Session detection algorithm

Sessions are generated ahead of time from `timetable_entries`. A pg_cron job runs every minute:

```sql
-- pseudo-logic
update sessions s
set status = 'live'
where s.status = 'scheduled'
  and now() between s.starts_at - grace_open and s.ends_at;

update sessions s
set status = 'completed'
where s.status = 'live' and now() > s.ends_at;

insert into attendance (session_id, student_id, status)
select s.id, e.student_id, 'absent'
from sessions s
join enrollments e on e.class_id = s.class_id
where s.status = 'completed'
  and s.ends_at between now() - interval '2 minutes' and now()
on conflict (session_id, student_id) do nothing;
```

- Times are stored as `timestamptz`; display uses the institution timezone.
- The API exposes `rpc_current_session(teacher_id)` returning live/next sessions, avoiding client clock trust.
- Manual overrides (`opened_at`, `closed_at`, `status_override`) are audited.

### 4.3 QR attendance flow

```
Teacher starts session
      │  POST /functions/v1/qr-issue { session_id }
      ▼
Edge Function validates teacher ownership + session live
      │  inserts qr_token (hash, expires_at = now + 20s, nonce)
      ▼
Client renders payload  classtrack://checkin?t=<opaque-token>
      │  rotates every 20s (new token, old token valid 2 periods)
      ▼
Student scans → POST /functions/v1/checkin { token }
      │
      ├─ verify HMAC / DB lookup, not expired, not used by this student
      ├─ verify enrollment + session window + QR enabled
      ├─ insert attendance (present/late by arrival time)
      └─ broadcast attendance insert → teacher live counter
```

Security properties:

- Opaque random token (128-bit), stored as SHA-256 hash; never exposes session IDs.
- Short TTL + rotation prevents screenshot sharing beyond ~40 seconds.
- Server-side window and enrollment validation; client clock irrelevant.
- Unique `(session_id, student_id)` prevents duplicates; rate limiting per IP/user.
- Manual override path for device failures is audited.

### 4.4 AI timetable import pipeline

```
Upload (image/PDF/text)
   │
   ▼
Storage (private) → Edge Function ai-timetable
   │  1. validate MIME/size, virus scan
   │  2. call vision model with strict JSON schema
   │  3. normalize weekdays/times/rooms; attach confidence
   │  4. detect conflicts against existing timetable
   ▼
Return draft rows (never persisted as schedule)
   │
   ▼
Teacher reviews/edits → confirm → transactional insert
   │
   └─ audit row: source, model, raw_response, corrections
```

- Schema validation with Zod; malformed model output is retried once, then falls back to manual.
- Cost controls: max 10 pages/upload, per-tenant monthly quota, caching by file hash.
- PII: images are processed transiently; retention configurable (default 12 months).

### 4.5 API surface (Edge Functions)

| Function | Method | Purpose | Auth |
|---|---|---|---|
| `qr-issue` | POST | Create rotating QR token for live session. | Teacher (owner) |
| `checkin` | POST | Validate QR and create attendance. | Student |
| `import-students` | POST | Parse + validate + commit roster import. | Teacher/Admin |
| `ai-timetable` | POST | Extract timetable draft from image/text. | Teacher |
| `report-export` | POST | Build CSV/PDF with current filters. | Teacher/Admin |
| `invite-teacher` | POST | Create invitation + email. | Admin |
| `session-action` | POST | Start/close/cancel/reschedule with audit. | Teacher/Admin |

All functions: JWT verification, rate limiting, idempotency keys for mutations, structured error codes.

### 4.6 Data access pattern

- Reads use PostgREST with RLS; complex aggregates use SQL views (`v_class_attendance`, `v_student_attendance`, `v_teacher_performance`).
- Writes that span tables (session cancel + notifications, import commit) use Postgres functions invoked via RPC, guaranteeing atomicity.
- Report queries hit pre-aggregated tables refreshed nightly, with live fallback for the current day.

---

## 5. Data Model (summary)

Core entities and relationships:

```
institutions 1─* profiles (teacher/admin/student)
institutions 1─* classes 1─* enrollments *─1 students
classes 1─* timetable_entries 1─* sessions 1─* attendance
sessions 1─* qr_tokens
attendance *─1 students
profiles 1─* notifications, audit_logs
institutions 1─* terms, departments, holidays
```

Key invariants:

- Unique `(class_id, student_id)` in enrollments.
- Unique `(session_id, student_id)` in attendance.
- Sessions reference a timetable entry; ad-hoc sessions may have `timetable_entry_id = null`.
- Attendance status enum `present|late|absent|excused`; `late_minutes` required when late.
- Soft deletes via `deleted_at`; all queries filter them in views.
- `institution_id` denormalized on every tenant table for fast RLS.

Full DDL: [`03-database-schema.sql`](./03-database-schema.sql).

---

## 6. Security Architecture

| Layer | Controls |
|---|---|
| Transport | TLS 1.3, HSTS, secure cookies for auth. |
| AuthN | Supabase Auth, short-lived JWT, refresh rotation, optional MFA. |
| AuthZ | Role checks in UI + RLS in DB + function-level checks. |
| Tenant isolation | `institution_id = auth.jwt() -> 'app_metadata' ->> 'institution_id'` in every policy. |
| QR | HMAC-signed opaque tokens, 20 s rotation, single-use per student, server time. |
| Files | Private buckets, signed URLs (5 min), MIME/size validation, AV scan. |
| Input | Zod schemas at the edge, DB constraints as the last line. |
| Audit | Append-only `audit_logs`, no update/delete policy for clients. |
| Secrets | Supabase Vault / function secrets; never in the client bundle. |
| Rate limits | Per-user and per-IP on check-in, imports and AI endpoints. |
| Privacy | Data minimization, retention policies, export/delete workflows. |

---

## 7. Scalability & Performance

- **Indexes:** partial indexes on active sessions, `(class_id, starts_at)`, `(student_id, session_id)` unique, trigram search on student names.
- **Partitioning:** `attendance` and `audit_logs` partitioned by term/year at scale.
- **Caching:** TanStack Query stale times (30 s dashboards, 5 min reports); CDN for static assets; materialized views for institution rollups.
- **Realtime:** broadcast only counters, not full rows, to keep payloads small.
- **Batch writes:** attendance bulk upsert (one statement per roster save).
- **Connection safety:** PostgREST pooling; Edge Functions use service role only for validated server operations.

---

## 8. Reliability & Observability

- Health checks on SPA, Auth, DB and Edge Functions.
- Sentry for frontend/edge exceptions with release tags.
- Postgres slow-query log; alerts on p95 > 500 ms.
- Metrics: check-in success rate, QR validation latency, AI extraction confidence, import failure rate.
- Daily backups + 30-day PITR; quarterly restore drills.
- Graceful degradation: if AI is unavailable, manual timetable import stays available; if Realtime drops, polling fallback every 15 s.

---

## 9. Environments & Deployment

| Environment | Purpose | Data |
|---|---|---|
| Local | Vite dev + Supabase CLI stack | Seed fixtures |
| Preview | Per-PR deploy | Anonymized subset |
| Staging | UAT with pilot teachers | Synthetic |
| Production | Live tenants | Real |

CI/CD pipeline:

1. Lint (`oxlint`), type-check, unit tests (Vitest), component tests (Testing Library).
2. Build SPA; run Playwright smoke tests against preview.
3. Apply Supabase migrations with `supabase db push` (expand/contract pattern).
4. Deploy Edge Functions; invalidate CDN; post-deploy health check.

---

## 10. Key Architecture Decisions (ADRs)

| # | Decision | Alternatives | Why |
|---|---|---|---|
| ADR-01 | Supabase as backend platform | Custom Node/NestJS + Postgres | Faster delivery, RLS tenant isolation, realtime built in. |
| ADR-02 | Server-side session detection | Client timer | Prevents clock tampering and inconsistent states. |
| ADR-03 | Opaque rotating QR tokens | Static session QR / signed JWT in QR | Limits sharing; no sensitive IDs exposed. |
| ADR-04 | AI proposes, human confirms | Fully automated import | Timetables are high-stakes; review prevents silent errors. |
| ADR-05 | Denormalized `institution_id` | Join-based RLS | Simple, fast, auditable policies. |
| ADR-06 | SVG charts, no chart dependency | Recharts/Chart.js | Full visual control, tiny bundle, accessible markup. |
| ADR-07 | Soft delete + audit | Hard delete | Academic records need traceability. |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Students share QR screenshots | Proxy attendance | 20 s rotation, optional geofence flag, anomaly detection. |
| AI misreads timetable | Wrong sessions | Confidence thresholds + mandatory review + conflict detection. |
| Poor classroom connectivity | Check-in failures | Manual teacher override, optimistic UI, retry queue. |
| RLS policy mistakes | Data leakage | Policy tests in CI, tenant-isolation integration tests, least privilege. |
| Large Excel files | Timeouts | Streaming parser, background job > 500 rows. |
| Realtime cost spikes | Budget | Broadcast counters only, channel-per-session, disconnect idle clients. |
