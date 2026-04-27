# Mizan — Data Intelligence & Governance Platform

**Mizan** (ميزان) is a commercial data intelligence and governance platform built by **AlphaPro Consulting** for Saudi/GCC enterprise clients. It features a bilingual (Arabic/English) interface with full RTL/LTR support and integrates with Ataccama ONE for enterprise data governance.

> **Architecture:** Railway-only deployment — PostgreSQL + Node.js API + Python scan engine on Railway; React frontend on Vercel.

## Platform Stages

| Stage | Product | Description |
|-------|---------|-------------|
| 1 | **Mizan Scan** | One-time data audit. Connects to client data sources, profiles data quality, generates a Data Maturity Index (DMI) score and bilingual PDF report. |
| 2 | **Mizan Monitor** | Monthly subscription. Continuous monitoring, automated alerts, live bilingual dashboard. |
| 3 | **Mizan Govern** | Ataccama ONE integration layer for enterprise data governance handoff. |

## Repository Layout

```
mizan/
├── apps/
│   ├── api/                    # Node.js + Express + TypeScript → Railway
│   │   ├── src/
│   │   │   ├── config/         # env.ts — environment validation (zod)
│   │   │   ├── lib/            # db.ts — PostgreSQL connection pool (pg)
│   │   │   ├── middleware/     # asyncHandler, error, auth (JWT)
│   │   │   ├── routes/         # clients, scans, data-sources, dmi-scores,
│   │   │   │                   # scan-results, reports, alerts, engine
│   │   │   ├── services/       # Business logic per resource
│   │   │   └── server.ts       # Express app entry point
│   │   ├── Dockerfile
│   │   ├── railway.json
│   │   └── .env.example
│   │
│   └── web/                    # React + Vite + Tailwind CSS → Vercel
│       ├── src/
│       │   ├── components/     # Layout, Sidebar, LanguageToggle
│       │   ├── lib/            # api.ts (Railway client), i18n.ts
│       │   ├── locales/        # en/common.json, ar/common.json
│       │   └── pages/          # Dashboard, Clients, Scans, Reports, Alerts
│       ├── vercel.json
│       └── .env.example
│
├── packages/
│   └── shared-types/           # TypeScript types shared by api + web
│       └── src/index.ts
│
├── services/
│   └── scan-engine/            # Python + Great Expectations → Railway worker
│       ├── src/mizan_scan/
│       │   ├── connectors/     # postgres.py — SQLAlchemy connector
│       │   ├── profilers/      # quality.py — Great Expectations profiling
│       │   ├── scoring/        # dmi.py — DMI weighted roll-up
│       │   └── output/         # schema.py — Pydantic output models
│       ├── Dockerfile
│       ├── railway.json
│       └── requirements.txt
│
└── database/
    └── migrations/
        └── 0001_initial_schema.sql   # Railway PostgreSQL schema (7 tables)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Database** | Railway PostgreSQL |
| **Backend** | Node.js 20 + Express + TypeScript |
| **Scan Engine** | Python 3.12 + Great Expectations + pandas |
| **Frontend** | React 18 + Vite + Tailwind CSS + i18next |
| **Charts** | Recharts (DMI gauge + trend charts) |
| **Deployment** | Railway (API + DB + Scan Engine), Vercel (Frontend) |
| **Bilingual** | Arabic (RTL) + English (LTR) via i18next |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Railway account (or local PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/alphapromena/Data-.git mizan
cd mizan
npm install
```

### 2. Database Setup

Create a Railway PostgreSQL database and run the migration:

```bash
psql $DATABASE_URL -f database/migrations/0001_initial_schema.sql
```

### 3. API (Backend)

```bash
cd apps/api
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET
npm run dev
# API running at http://localhost:4000
```

### 4. Web (Frontend)

```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:4000
npm run dev
# Dashboard at http://localhost:5173
```

### 5. Scan Engine (Python)

```bash
cd services/scan-engine
pip install -e .
cp .env.example .env
# Edit .env: TARGET_PG_DSN=postgresql://user:pass@host:5432/client_db
python -m mizan_scan --scan-id <UUID> --dsn postgresql://...
```

## API Reference

All endpoints are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET/POST | `/clients` | List / create clients |
| GET/PATCH/DELETE | `/clients/:id` | Get / update / delete client |
| GET/POST | `/scans` | List / create scans |
| GET/PATCH/DELETE | `/scans/:id` | Get / update / delete scan |
| GET/POST | `/data-sources` | List / create data sources |
| GET/DELETE | `/data-sources/:id` | Get / delete data source |
| GET | `/scan-results` | List scan results |
| GET | `/scan-results/:id` | Get scan result |
| GET | `/dmi-scores` | List DMI scores |
| GET | `/dmi-scores/scan/:scan_id` | Get DMI score by scan |
| GET/POST | `/reports` | List / create reports |
| GET | `/reports/:id` | Get report |
| GET | `/alerts` | List alerts |
| PATCH | `/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/engine/run` | Trigger scan engine (async, 202) |

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `PORT` | Server port (default: 4000) |
| `CORS_ORIGIN` | Frontend URL for CORS |
| `SCAN_ENGINE_CMD` | Command to invoke the Python scan engine |

### Web (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Railway API base URL |

### Scan Engine (`services/scan-engine/.env`)

| Variable | Description |
|----------|-------------|
| `TARGET_PG_DSN` | Client's PostgreSQL DSN to profile |
| `SAMPLE_SIZE` | Max rows to sample per table (default: 100000) |

**Never commit real keys.** `.env` files are gitignored.

## Data Maturity Index (DMI)

The DMI is a weighted composite score (0–100) across five dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Completeness | 25% | % of non-null cells |
| Consistency | 20% | Data type consistency across columns |
| Accuracy | 20% | Great Expectations validation pass rate |
| Duplication | 15% | 100 − duplicate row % |
| Compliance | 20% | % of datasets with no compliance flags |

**Grade scale:** A (90–100) · B (80–89) · C (70–79) · D (60–69) · E (0–59)

## Deployment

### Railway (API + Scan Engine)

1. Create a new Railway project
2. Add a PostgreSQL service — Railway injects `DATABASE_URL` automatically
3. Deploy `apps/api` as a service pointing to `apps/api/Dockerfile`
4. Deploy `services/scan-engine` as a worker service
5. Set environment variables in the Railway dashboard

### Vercel (Frontend)

1. Import the repository in Vercel
2. Set root directory to `apps/web`
3. Set `VITE_API_URL` to your Railway API URL
4. Deploy

## Built By

**AlphaPro Consulting** — Enterprise Data & AI Consultancy, MENA Region  
Ataccama ONE Partner · Saudi Arabia · UAE

---

*Mizan — bringing balance to your data.*
