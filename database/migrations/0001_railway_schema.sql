-- =============================================================================
-- Mizan Platform — Railway PostgreSQL Schema
-- Run this in the Railway database query editor or via psql
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Custom ENUM types
-- ---------------------------------------------------------------------
do $$ begin
  create type mizan_stage     as enum ('scan', 'monitor', 'govern');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type scan_status     as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type source_kind     as enum ('postgres', 'mysql', 'mssql', 'oracle', 'sap_hana', 'excel', 'csv');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type report_language as enum ('en', 'ar', 'bilingual');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type report_status   as enum ('draft', 'generated', 'delivered');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type alert_severity  as enum ('info', 'warning', 'critical');
  exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- clients — enterprise clients (tenants)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
    id              uuid primary key default gen_random_uuid(),
    name_en         text not null,
    name_ar         text not null,
    industry        text,
    country_code    char(2) not null default 'SA',
    contact_email   text,
    contact_phone   text,
    stage           mizan_stage not null default 'scan',
    is_active       boolean not null default true,
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- data_sources — client data source connections
-- ---------------------------------------------------------------------
create table if not exists public.data_sources (
    id                  uuid primary key default gen_random_uuid(),
    client_id           uuid not null references public.clients(id) on delete cascade,
    name                text not null,
    kind                source_kind not null,
    connection_config   jsonb not null default '{}',
    secret_ref          text,
    is_active           boolean not null default true,
    last_tested_at      timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index if not exists data_sources_client_id_idx on public.data_sources(client_id);

-- ---------------------------------------------------------------------
-- scans — scan jobs (Mizan Scan + Monitor)
-- ---------------------------------------------------------------------
create table if not exists public.scans (
    id              uuid primary key default gen_random_uuid(),
    client_id       uuid not null references public.clients(id) on delete cascade,
    data_source_id  uuid not null references public.data_sources(id) on delete restrict,
    stage           mizan_stage not null default 'scan',
    status          scan_status not null default 'pending',
    triggered_by    uuid,
    started_at      timestamptz,
    completed_at    timestamptz,
    error_message   text,
    config          jsonb not null default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index if not exists scans_client_id_idx on public.scans(client_id);
create index if not exists scans_status_idx    on public.scans(status);

-- ---------------------------------------------------------------------
-- scan_results — per-dataset profiling output
-- ---------------------------------------------------------------------
create table if not exists public.scan_results (
    id                  uuid primary key default gen_random_uuid(),
    scan_id             uuid not null references public.scans(id) on delete cascade,
    dataset_name        text not null,
    row_count           bigint,
    column_count        int,
    completeness_pct    numeric(5,2),
    duplicate_pct       numeric(5,2),
    null_pct            numeric(5,2),
    consistency_score   numeric(5,2),
    accuracy_score      numeric(5,2),
    compliance_flags    text[] not null default '{}',
    column_profile      jsonb not null default '{}',
    raw_output          jsonb not null default '{}',
    created_at          timestamptz not null default now()
);
create index if not exists scan_results_scan_id_idx on public.scan_results(scan_id);

-- ---------------------------------------------------------------------
-- dmi_scores — Data Maturity Index roll-up per scan
-- ---------------------------------------------------------------------
create table if not exists public.dmi_scores (
    id                  uuid primary key default gen_random_uuid(),
    scan_id             uuid not null references public.scans(id) on delete cascade,
    client_id           uuid not null references public.clients(id) on delete cascade,
    overall_score       numeric(5,2) not null,
    completeness_score  numeric(5,2) not null,
    consistency_score   numeric(5,2) not null,
    accuracy_score      numeric(5,2) not null,
    duplication_score   numeric(5,2) not null,
    compliance_score    numeric(5,2) not null,
    grade               text,
    breakdown           jsonb not null default '{}',
    created_at          timestamptz not null default now()
);
create index if not exists dmi_scores_client_id_idx on public.dmi_scores(client_id);

-- ---------------------------------------------------------------------
-- reports — generated bilingual PDF reports
-- ---------------------------------------------------------------------
create table if not exists public.reports (
    id              uuid primary key default gen_random_uuid(),
    scan_id         uuid not null references public.scans(id) on delete cascade,
    client_id       uuid not null references public.clients(id) on delete cascade,
    title_en        text not null,
    title_ar        text not null,
    language        report_language not null default 'bilingual',
    status          report_status not null default 'draft',
    storage_path    text,
    generated_at    timestamptz,
    delivered_at    timestamptz,
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index if not exists reports_client_id_idx on public.reports(client_id);
create index if not exists reports_scan_id_idx   on public.reports(scan_id);

-- ---------------------------------------------------------------------
-- alerts — monitoring alerts (Mizan Monitor)
-- ---------------------------------------------------------------------
create table if not exists public.alerts (
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
    payload         jsonb not null default '{}',
    created_at      timestamptz not null default now()
);
create index if not exists alerts_client_id_idx on public.alerts(client_id);
create index if not exists alerts_severity_idx  on public.alerts(severity);

-- ---------------------------------------------------------------------
-- updated_at auto-trigger function
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

do $$ begin
  create trigger clients_set_updated_at      before update on public.clients      for each row execute function public.set_updated_at();
  exception when duplicate_object then null;
end $$;
do $$ begin
  create trigger data_sources_set_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
  exception when duplicate_object then null;
end $$;
do $$ begin
  create trigger scans_set_updated_at        before update on public.scans        for each row execute function public.set_updated_at();
  exception when duplicate_object then null;
end $$;
do $$ begin
  create trigger reports_set_updated_at      before update on public.reports      for each row execute function public.set_updated_at();
  exception when duplicate_object then null;
end $$;

-- Done!
select 'Mizan schema applied successfully ✓' as result;
