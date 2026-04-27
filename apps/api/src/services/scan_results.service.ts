import type { UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

export interface ScanResult {
  id: string;
  scan_id: string;
  dataset_name: string;
  row_count: number | null;
  column_count: number | null;
  completeness_pct: string | null;
  duplicate_pct: string | null;
  null_pct: string | null;
  consistency_score: string | null;
  accuracy_score: string | null;
  compliance_flags: unknown[];
  column_profile: Record<string, unknown>;
  raw_output: Record<string, unknown>;
  created_at: string;
}

export interface CreateScanResultInput {
  scan_id: UUID;
  dataset_name: string;
  row_count?: number;
  column_count?: number;
  completeness_pct?: number;
  duplicate_pct?: number;
  null_pct?: number;
  consistency_score?: number;
  accuracy_score?: number;
  compliance_flags?: unknown[];
  column_profile?: Record<string, unknown>;
  raw_output?: Record<string, unknown>;
}

export const scanResultsService = {
  async listByScan(scan_id: UUID): Promise<ScanResult[]> {
    return query<ScanResult>(
      `SELECT * FROM public.scan_results WHERE scan_id = $1 ORDER BY created_at ASC`,
      [scan_id],
    );
  },

  async get(id: UUID): Promise<ScanResult> {
    const row = await queryOne<ScanResult>(
      `SELECT * FROM public.scan_results WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Scan result not found');
    return row;
  },

  async create(input: CreateScanResultInput): Promise<ScanResult> {
    const {
      scan_id, dataset_name, row_count, column_count,
      completeness_pct, duplicate_pct, null_pct,
      consistency_score, accuracy_score,
      compliance_flags = [], column_profile = {}, raw_output = {},
    } = input;
    const row = await queryOne<ScanResult>(
      `INSERT INTO public.scan_results
         (scan_id, dataset_name, row_count, column_count, completeness_pct,
          duplicate_pct, null_pct, consistency_score, accuracy_score,
          compliance_flags, column_profile, raw_output)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        scan_id, dataset_name, row_count ?? null, column_count ?? null,
        completeness_pct ?? null, duplicate_pct ?? null, null_pct ?? null,
        consistency_score ?? null, accuracy_score ?? null,
        JSON.stringify(compliance_flags), JSON.stringify(column_profile), JSON.stringify(raw_output),
      ],
    );
    if (!row) throw new HttpError(500, 'Failed to create scan result');
    return row;
  },
};
