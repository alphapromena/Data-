/**
 * Mizan API client — connects to the Railway-hosted Node.js/Express backend.
 * All requests go through /api/v1 on the VITE_API_URL base.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'https://3001-i43152d26u67ymnp67m3f-2a08f4a3.sg1.manus.computer';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => request<Client[]>('/clients'),
  get: (id: string) => request<Client>(`/clients/${id}`),
  create: (body: CreateClientInput) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<CreateClientInput>) =>
    request<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/clients/${id}`, { method: 'DELETE' }),
};

// ── Scans ─────────────────────────────────────────────────────────────────────
export const scansApi = {
  list: (client_id?: string) =>
    request<Scan[]>(`/scans${client_id ? `?client_id=${client_id}` : ''}`),
  get: (id: string) => request<Scan>(`/scans/${id}`),
  create: (body: CreateScanInput) =>
    request<Scan>('/scans', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Scan>) =>
    request<Scan>(`/scans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/scans/${id}`, { method: 'DELETE' }),
};

// ── Data Sources ──────────────────────────────────────────────────────────────
export const dataSourcesApi = {
  list: (client_id?: string) =>
    request<DataSource[]>(`/data-sources${client_id ? `?client_id=${client_id}` : ''}`),
  get: (id: string) => request<DataSource>(`/data-sources/${id}`),
  create: (body: CreateDataSourceInput) =>
    request<DataSource>('/data-sources', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/data-sources/${id}`, { method: 'DELETE' }),
};

// ── DMI Scores ────────────────────────────────────────────────────────────────
export const dmiApi = {
  listByClient: (client_id: string) =>
    request<DmiScore[]>(`/dmi-scores?client_id=${client_id}`),
  getByScan: (scan_id: string) =>
    request<DmiScore>(`/dmi-scores/scan/${scan_id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  listByClient: (client_id: string) =>
    request<Report[]>(`/reports?client_id=${client_id}`),
  get: (id: string) => request<Report>(`/reports/${id}`),
  create: (body: CreateReportInput) =>
    request<Report>('/reports', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = {
  listByClient: (client_id: string, unacknowledged = false) =>
    request<Alert[]>(`/alerts?client_id=${client_id}&unacknowledged=${unacknowledged}`),
  get: (id: string) => request<Alert>(`/alerts/${id}`),
  acknowledge: (id: string, user_id: string) =>
    request<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ user_id }),
    }),
};

// ── Engine ────────────────────────────────────────────────────────────────────
export const engineApi = {
  run: (scan_id: string, dsn: string, tables?: string[]) =>
    request<{ message: string; scan_id: string; status: string }>('/engine/run', {
      method: 'POST',
      body: JSON.stringify({ scan_id, dsn, tables }),
    }),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health'),
};

// ── Local type aliases (mirrors shared-types) ─────────────────────────────────
export interface Client {
  id: string;
  name_en: string;
  name_ar: string;
  industry: string | null;
  country_code: string;
  contact_email: string | null;
  contact_phone: string | null;
  stage: 'scan' | 'monitor' | 'govern';
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
  stage?: 'scan' | 'monitor' | 'govern';
  metadata?: Record<string, unknown>;
}

export interface Scan {
  id: string;
  client_id: string;
  data_source_id: string;
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateScanInput {
  client_id: string;
  data_source_id: string;
  stage?: string;
  config?: Record<string, unknown>;
}

export interface DataSource {
  id: string;
  client_id: string;
  name: string;
  kind: string;
  connection_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface CreateDataSourceInput {
  client_id: string;
  name: string;
  kind: string;
  connection_config?: Record<string, unknown>;
  secret_ref?: string;
}

export interface DmiScore {
  id: string;
  scan_id: string;
  client_id: string;
  overall_score: string;
  completeness_score: string;
  consistency_score: string;
  accuracy_score: string;
  duplication_score: string;
  compliance_score: string;
  grade: string;
  created_at: string;
}

export interface Report {
  id: string;
  scan_id: string;
  client_id: string;
  title_en: string;
  title_ar: string;
  language: string;
  status: string;
  storage_path: string | null;
  generated_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface CreateReportInput {
  scan_id: string;
  client_id: string;
  title_en: string;
  title_ar: string;
  language?: 'en' | 'ar' | 'bilingual';
}

export interface Alert {
  id: string;
  client_id: string;
  scan_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  title_en: string;
  title_ar: string;
  message_en: string | null;
  message_ar: string | null;
  is_acknowledged: boolean;
  created_at: string;
}
