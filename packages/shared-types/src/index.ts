/**
 * @mizan/shared-types — TypeScript types shared between @mizan/api and @mizan/web.
 * Keep these in sync with the PostgreSQL schema in database/migrations/0001_initial_schema.sql
 */

export type UUID = string;

// ── Enums ─────────────────────────────────────────────────────────────────────
export type MizanStage     = 'scan' | 'monitor' | 'govern';
export type ScanStatus     = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SourceKind     = 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'sap_hana' | 'excel' | 'csv';
export type ReportLanguage = 'en' | 'ar' | 'bilingual';
export type ReportStatus   = 'draft' | 'generated' | 'delivered';
export type AlertSeverity  = 'info' | 'warning' | 'critical';

// ── Client ────────────────────────────────────────────────────────────────────
export interface Client {
  id: UUID;
  name_en: string;
  name_ar: string;
  industry: string | null;
  country_code: string;
  contact_email: string | null;
  contact_phone: string | null;
  stage: MizanStage;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name_en: string;
  name_ar: string;
  industry?: string;
  country_code?: string;
  contact_email?: string;
  contact_phone?: string;
  stage?: MizanStage;
  metadata?: Record<string, unknown>;
}

export type UpdateClientInput = Partial<CreateClientInput>;

// ── DataSource ────────────────────────────────────────────────────────────────
export interface DataSource {
  id: UUID;
  client_id: UUID;
  name: string;
  kind: SourceKind;
  connection_config: Record<string, unknown>;
  secret_ref: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDataSourceInput {
  client_id: UUID;
  name: string;
  kind: SourceKind;
  connection_config?: Record<string, unknown>;
  secret_ref?: string;
}

// ── Scan ──────────────────────────────────────────────────────────────────────
export interface Scan {
  id: UUID;
  client_id: UUID;
  data_source_id: UUID;
  stage: MizanStage;
  status: ScanStatus;
  triggered_by: UUID | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateScanInput {
  client_id: UUID;
  data_source_id: UUID;
  stage?: MizanStage;
  config?: Record<string, unknown>;
}

export interface UpdateScanInput {
  status?: ScanStatus;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  config?: Record<string, unknown>;
}

// ── ScanResult ────────────────────────────────────────────────────────────────
export interface ScanResult {
  id: UUID;
  scan_id: UUID;
  dataset_name: string;
  row_count: number | null;
  column_count: number | null;
  completeness_pct: string | null;
  duplicate_pct: string | null;
  null_pct: string | null;
  consistency_score: string | null;
  accuracy_score: string | null;
  compliance_flags: string[];
  column_profile: Record<string, unknown>;
  raw_output: Record<string, unknown>;
  created_at: string;
}

// ── DmiScore ──────────────────────────────────────────────────────────────────
export interface DmiScore {
  id: UUID;
  scan_id: UUID;
  client_id: UUID;
  overall_score: string;
  completeness_score: string;
  consistency_score: string;
  accuracy_score: string;
  duplication_score: string;
  compliance_score: string;
  grade: string | null;
  breakdown: Record<string, unknown>;
  created_at: string;
}

// ── Report ────────────────────────────────────────────────────────────────────
export interface Report {
  id: UUID;
  scan_id: UUID;
  client_id: UUID;
  title_en: string;
  title_ar: string;
  language: ReportLanguage;
  status: ReportStatus;
  storage_path: string | null;
  generated_at: string | null;
  delivered_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export interface Alert {
  id: UUID;
  client_id: UUID;
  scan_id: UUID | null;
  data_source_id: UUID | null;
  severity: AlertSeverity;
  title_en: string;
  title_ar: string;
  message_en: string | null;
  message_ar: string | null;
  is_acknowledged: boolean;
  acknowledged_by: UUID | null;
  acknowledged_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// ── Scan Engine Output (Python → Node.js contract) ────────────────────────────
export interface ColumnProfile {
  dtype: string;
  null_pct: number;
  unique_count: number;
  dtype_consistency: number;
}

export interface DatasetProfile {
  dataset_name: string;
  row_count: number;
  column_count: number;
  completeness_pct: number;
  duplicate_pct: number;
  null_pct: number;
  consistency_score: number;
  accuracy_score: number;
  compliance_flags: string[];
  column_profile: Record<string, ColumnProfile>;
}

export interface DmiOutput {
  overall_score: number;
  completeness_score: number;
  consistency_score: number;
  accuracy_score: number;
  duplication_score: number;
  compliance_score: number;
  grade: string;
}

export interface ScanEngineOutput {
  scan_id: string;
  client_id: string | null;
  data_source: { kind: string; name: string };
  datasets: DatasetProfile[];
  dmi: DmiOutput;
  generated_at: string;
}
