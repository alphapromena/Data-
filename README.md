# Mizan

**Data Intelligence & Governance Platform** — built by AlphaPro Consulting for Saudi/GCC enterprises.

Mizan delivers data quality assessment, ongoing governance, and Ataccama ONE handoff in three stages:

| Stage | Description |
|---|---|
| **Mizan Scan** | One-time data audit. Profiles connected sources, computes a Data Maturity Index (DMI) score 0–100, produces a bilingual (AR/EN) executive PDF report. |
| **Mizan Monitor** | Monthly subscription. Continuous monitoring, alerts, monthly reports, live bilingual dashboard. |
| **Mizan Govern** | Integration layer for handoff to Ataccama ONE. |

## Repository layout

```
Data-/
├── apps/
│   ├── api/                  Node.js + Express + TypeScript  → Railway
│   └── web/                  React + Vite + TypeScript       → Vercel
├── services/
│   └── scan-engine/          Python + Great Expectations + pandas
├── packages/
│   └── shared-types/         TypeScript types shared between api ↔ web
└── supabase/
    └── migrations/           SQL migrations (7 tables + RLS)
```

## Tech stack

- **Backend (API):** Node.js 20, Express, TypeScript, Supabase (service role)
- **Frontend:** React 18, Vite, TypeScript, react-i18next, react-router
- **Profiling engine:** Python 3.11, Great Expectations, pandas, psycopg
- **Data layer:** Supabase (Postgres 15, Auth, Realtime, Storage)
- **Hosting:** Railway (api), Vercel (web), Supabase (data)

## Prerequisites

- Node.js 20+ (`nvm use`)
- Python 3.11+
- A Supabase project (URL + service-role key + publishable key)

## Quick start

```bash
# 1. Install JS workspaces
npm install

# 2. Copy env templates and fill in real values
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp services/scan-engine/.env.example services/scan-engine/.env

# 3. Apply Supabase migrations
#    Either via Supabase CLI:
#      supabase db push
#    Or paste supabase/migrations/0001_initial_schema.sql into the SQL editor.

# 4. Set up the Python scan engine
cd services/scan-engine
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 5. Run dev servers (from repo root, in separate terminals)
npm run dev:api      # http://localhost:4000
npm run dev:web      # http://localhost:5173
```

## Deployment

- **API → Railway:** point at `apps/api/`, set env vars, build `npm run build`, start `npm start`.
- **Web → Vercel:** root = `apps/web`, framework = Vite, env vars set in dashboard.
- **Scan engine:** runs as a CLI invoked by the API (subprocess) or as a Railway worker.

## Environment variables

See each `.env.example`:

- `apps/api/.env.example` — server, Supabase URL + service role
- `apps/web/.env.example` — Supabase URL + publishable (anon) key
- `services/scan-engine/.env.example` — target Postgres source DSN

**Never commit real keys.** `.env` files are gitignored.
