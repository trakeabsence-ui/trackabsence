# ClassTrack

React + Vite attendance platform. Product docs live in [`docs/`](./docs), and the Supabase/PostgreSQL implementation lives in [`supabase/`](./supabase).

## Database

- Design and RLS model: [`docs/04-database-design.md`](./docs/04-database-design.md)
- Migrations: [`supabase/migrations/`](./supabase/migrations)
- Local fixtures: [`supabase/seed.sql`](./supabase/seed.sql)

Run locally with `supabase start && supabase db reset`. Do not apply `seed.sql` to production.

## Supabase auth

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` using your Supabase project settings. `.env.local` is ignored by Git; `.env.example` documents the required variable names.

Public registration supports teacher and student accounts. Administrator accounts must be provisioned by a trusted server-side process; a browser-supplied role or authorization code is not trusted.

Before enabling registration on a fresh database, provision one active institution. For multiple institutions, the trusted signup flow must assign the account's institution. Add your app origin to Supabase's allowed redirect URLs for password recovery.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
