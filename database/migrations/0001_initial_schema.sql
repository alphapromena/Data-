-- =====================================================================
-- Mizan — initial schema
-- Tables: clients, data_sources, scans, scan_results, dmi_scores,
--         reports, alerts
-- Conventions: all tables tenant-scoped via client_id; RLS enabled.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type mizan_stage      as enum ('scan', 'monitor', 'govern');
create type scan_status      as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type source_kind      as enum ('postgres', 'mysql', 'mssql', 'oracle', 'sap_hana', 'excel', 'csv');
create type report_language  as enum ('en', 'ar', 'bilingual');
create type report_status    as enum ('draft', 'generated', 'delivered');
create type alert_severity   as enum ('info', 'warning', 'critical');

-- ---------------------------------------------------------------------
-- clients — enterprise customers
-- ---------------------------------------------------------------------
create table public.clients (
    id              uuid primary key default gen_random_uuid(),
    name_en         text not null,
    name_ar         text not null,
    industry        text,
    country_code    text default 'SA',
    contact_email   text,
    contact_phone   text,
    stage           mizan_stage not null default 'scan',
    is_active       boolean not null default true,
    metadata        jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- data_sources — connections to client systems (SAP, Oracle, SQL, files)
-- ---------------------------------------------------------------------
create table public.data_sources (
    id                  uuid primary key default gen_random_uuid(),
    client_id           uuid not null references public.clients(id) on delete cascade,
    name                text not null,
    kind                source_kind not null,
    -- connection_config holds non-secret fields (host, port, database, schema, file path, etc.)
    -- secrets (passwords) are NEVER stored here; use Supabase Vault or Railway env refs.
    connection_config   jsonb not null default '{}'::jsonb,
    secret_ref          text,
    is_active           boolean not null default true,
    last_tested_at      timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index data_sources_client_id_idx on public.data_sources(client_id);

-- ---------------------------------------------------------------------
-- scans — a profiling run (one-time Mizan Scan or recurring Monitor)
-- ---------------------------------------------------------------------
create table public.scans (
    id              uuid primary key default gen_random_uuid(),
    client_id       uuid not null references public.clients(id) on delete cascade,
    data_source_id  uuid not null references public.data_sources(id) on delete restrict,
    stage           mizan_stage not null default 'scan',
    status          scan_status not null default 'pending',
    triggered_by    uuid, -- auth.users id; nullable for system-triggered
    started_at      timestamptz,
    completed_at    timestamptz,
    error_message   text,
    config          jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index scans_client_id_idx     on public.scans(client_id);
create index scans_data_source_idx   on public.scans(data_source_id);
create index scans_status_idx        on public.scans(status);

-- ---------------------------------------------------------------------
-- scan_results — per-table or per-dataset profiling output
-- ---------------------------------------------------------------------
create table public.scan_results (
    id                  uuid primary key default gen_random_uuid(),
    scan_id             uuid not null references public.scans(id) on delete cascade,
    dataset_name        text not null,           -- schema.table or file name
    row_count           bigint,
    column_count        integer,
    completeness_pct    numeric(5,2),            -- 0.00–100.00
    duplicate_pct       numeric(5,2),
    null_pct            numeric(5,2),
    consistency_score   numeric(5,2),
    accuracy_score      numeric(5,2),
    compliance_flags    jsonb not null default '[]'::jsonb,
    column_profile      jsonb not null default '{}'::jsonb, -- per-column GE expectations
    raw_output          jsonb not null default '{}'::jsonb, -- full GE JSON
    created_at          timestamptz not null default now()
);

create index scan_results_scan_id_idx on public.scan_results(scan_id);

-- ---------------------------------------------------------------------
-- dmi_scores — Data Maturity Index roll-up per scan
-- ---------------------------------------------------------------------
create table public.dmi_scores (
    id                  uuid primary key default gen_random_uuid(),
    scan_id             uuid not null unique references public.scans(id) on delete cascade,
    client_id           uuid not null references public.clients(id) on delete cascade,
    overall_score       numeric(5,2) not null,   -- 0.00–100.00
    completeness_score  numeric(5,2) not null,
    consistency_score   numeric(5,2) not null,
    accuracy_score      numeric(5,2) not null,
    duplication_score   numeric(5,2) not null,
    compliance_score    numeric(5,2) not null,
    grade               text,                    -- A/B/C/D/E label
    breakdown           jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now()
);

create index dmi_scores_client_id_idx on public.dmi_scores(client_id);

-- ---------------------------------------------------------------------
-- reports — generated PDF outputs (executive bilingual reports)
-- ---------------------------------------------------------------------
create table public.reports (
    id              uuid primary key default gen_random_uuid(),
    scan_id         uuid not null references public.scans(id) on delete cascade,
    client_id       uuid not null references public.clients(id) on delete cascade,
    title_en        text not null,
    title_ar        text not null,
    language        report_language not null default 'bilingual',
    status          report_status not null default 'draft',
    storage_path    text,                        -- Supabase Storage object path
    generated_at    timestamptz,
    delivered_at    timestamptz,
    metadata        jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index reports_client_id_idx on public.reports(client_id);
create index reports_scan_id_idx   on public.reports(scan_id);

-- ---------------------------------------------------------------------
-- alerts — monitoring alerts (Mizan Monitor)
-- ---------------------------------------------------------------------
create table public.alerts (
    id              uuid primary key default gen_random_uuid(),
    client_id       uuid not null references public.clients(id) on delete cascade,
    scan_id         uuid references public.scans(id) on delete set null,
    data_source_id  uuid references public.data_sources(id) on delete set null,
    severity        alert_severity not null default 'info',
    title_en        text not null,
    title_ar        text not null,
    message_en      text,
    message_ar      text,
    is_acknowledged boolean not null default false,
    acknowledged_by uuid,
    acknowledged_at timestamptz,
    payload         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index alerts_client_id_idx on public.alerts(client_id);
create index alerts_severity_idx  on public.alerts(severity);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger clients_set_updated_at      before update on public.clients      for each row execute function public.set_updated_at();
create trigger data_sources_set_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
create trigger scans_set_updated_at        before update on public.scans        for each row execute function public.set_updated_at();
create trigger reports_set_updated_at      before update on public.reports      for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row-Level Security
-- Default: deny all from anon/authenticated; service_role bypasses RLS.
-- Per-client tenancy will be layered in once user↔client mapping is defined.
-- ---------------------------------------------------------------------
alter table public.clients       enable row level security;
alter table public.data_sources  enable row level security;
alter table public.scans         enable row level security;
alter table public.scan_results  enable row level security;
alter table public.dmi_scores    enable row level security;
alter table public.reports       enable row level security;
alter table public.alerts        enable row level security;

-- Placeholder authenticated read policies (refine once auth.users ↔ clients mapping exists).
create policy "authenticated_read_clients"      on public.clients      for select to authenticated using (true);
create policy "authenticated_read_data_sources" on public.data_sources for select to authenticated using (true);
create policy "authenticated_read_scans"        on public.scans        for select to authenticated using (true);
create policy "authenticated_read_scan_results" on public.scan_results for select to authenticated using (true);
create policy "authenticated_read_dmi_scores"   on public.dmi_scores   for select to authenticated using (true);
create policy "authenticated_read_reports"      on public.reports      for select to authenticated using (true);
create policy "authenticated_read_alerts"       on public.alerts       for select to authenticated using (true);
