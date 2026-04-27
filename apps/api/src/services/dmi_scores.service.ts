import type { UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

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
  grade: string | null;
  breakdown: Record<string, unknown>;
  created_at: string;
}

export interface CreateDmiScoreInput {
  scan_id: UUID;
  client_id: UUID;
  overall_score: number;
  completeness_score: number;
  consistency_score: number;
  accuracy_score: number;
  duplication_score: number;
  compliance_score: number;
  grade?: string;
  breakdown?: Record<string, unknown>;
}

export const dmiScoresService = {
  async listByClient(client_id: UUID): Promise<DmiScore[]> {
    return query<DmiScore>(
      `SELECT d.* FROM public.dmi_scores d
       WHERE d.client_id = $1 ORDER BY d.created_at DESC`,
      [client_id],
    );
  },

  async getByScan(scan_id: UUID): Promise<DmiScore> {
    const row = await queryOne<DmiScore>(
      `SELECT * FROM public.dmi_scores WHERE scan_id = $1`, [scan_id],
    );
    if (!row) throw new HttpError(404, 'DMI score not found for this scan');
    return row;
  },

  async create(input: CreateDmiScoreInput): Promise<DmiScore> {
    const {
      scan_id, client_id, overall_score, completeness_score,
      consistency_score, accuracy_score, duplication_score,
      compliance_score, grade, breakdown = {},
    } = input;
    const row = await queryOne<DmiScore>(
      `INSERT INTO public.dmi_scores
         (scan_id, client_id, overall_score, completeness_score, consistency_score,
          accuracy_score, duplication_score, compliance_score, grade, breakdown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        scan_id, client_id, overall_score, completeness_score, consistency_score,
        accuracy_score, duplication_score, compliance_score, grade ?? null,
        JSON.stringify(breakdown),
      ],
    );
    if (!row) throw new HttpError(500, 'Failed to create DMI score');
    return row;
  },
};
