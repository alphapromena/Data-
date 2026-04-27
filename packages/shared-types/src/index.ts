// Domain types shared between @mizan/api and @mizan/web.
// Mirrors the Supabase schema in supabase/migrations/0001_initial_schema.sql.

export type UUID = string;
export type Timestamp = string; // ISO 8601

export type MizanStage = 'scan' | 'monitor' | 'govern';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SourceKind = 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'sap_hana' | 'excel' | 'csv';
export type ReportLanguage = 'en' | 'ar' | 'bilingual';
export type ReportStatus = 'draft' | 'generated' | 'delivered';
export type AlertSeverity = 'info' | 'warning' | 'critical';

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
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DataSource {
  id: UUID;
  client_id: UUID;
  name: string;
  kind: SourceKind;
  connection_config: Record<string, unknown>;
  secret_ref: string | null;
  is_active: boolean;
  last_tested_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Scan {
  id: UUID;
  client_id: UUID;
  data_source_id: UUID;
  stage: MizanStage;
  status: ScanStatus;
  triggered_by: UUID | null;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  error_message: string | null;
  config: Record<string, unknown>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ScanResult {
  id: UUID;
  scan_id: UUID;
  dataset_name: string;
  row_count: number | null;
  column_count: number | null;
  completeness_pct: number | null;
  duplicate_pct: number | null;
  null_pct: number | null;
  consistency_score: number | null;
  accuracy_score: number | null;
  compliance_flags: unknown[];
  column_profile: Record<string, unknown>;
  raw_output: Record<string, unknown>;
  created_at: Timestamp;
}

export interface DMIScore {
  id: UUID;
  scan_id: UUID;
  client_id: UUID;
  overall_score: number;
  completeness_score: number;
  consistency_score: number;
  accuracy_score: number;
  duplication_score: number;
  compliance_score: number;
  grade: string | null;
  breakdown: Record<string, unknown>;
  created_at: Timestamp;
}

export interface Report {
  id: UUID;
  scan_id: UUID;
  client_id: UUID;
  title_en: string;
  title_ar: string;
  language: ReportLanguage;
  status: ReportStatus;
  storage_path: string | null;
  generated_at: Timestamp | null;
  delivered_at: Timestamp | null;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

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
  acknowledged_at: Timestamp | null;
  payload: Record<string, unknown>;
  created_at: Timestamp;
}

// API request payloads -------------------------------------------------

export type CreateClientInput = Pick<
  Client,
  'name_en' | 'name_ar'
> & Partial<Pick<Client, 'industry' | 'country_code' | 'contact_email' | 'contact_phone' | 'stage' | 'metadata'>>;

export type UpdateClientInput = Partial<CreateClientInput> & { is_active?: boolean };

export type CreateScanInput = {
  client_id: UUID;
  data_source_id: UUID;
  stage?: MizanStage;
  config?: Record<string, unknown>;
};

export type UpdateScanInput = Partial<{
  status: ScanStatus;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  error_message: string | null;
  config: Record<string, unknown>;
}>;

// Output of the Python scan engine ------------------------------------

export interface ScanEngineOutput {
  scan_id: UUID;
  data_source: { kind: SourceKind; name: string };
  datasets: Array<{
    dataset_name: string;
    row_count: number;
    column_count: number;
    completeness_pct: number;
    duplicate_pct: number;
    null_pct: number;
    consistency_score: number;
    accuracy_score: number;
    compliance_flags: string[];
    column_profile: Record<string, unknown>;
  }>;
  dmi: {
    overall_score: number;
    completeness_score: number;
    consistency_score: number;
    accuracy_score: number;
    duplication_score: number;
    compliance_score: number;
    grade: string;
  };
  generated_at: Timestamp;
}
