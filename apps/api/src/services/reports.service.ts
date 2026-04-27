import type { UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

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
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  scan_id: UUID;
  client_id: UUID;
  title_en: string;
  title_ar: string;
  language?: 'en' | 'ar' | 'bilingual';
}

export const reportsService = {
  async listByClient(client_id: UUID): Promise<Report[]> {
    return query<Report>(
      `SELECT * FROM public.reports WHERE client_id = $1 ORDER BY created_at DESC`,
      [client_id],
    );
  },

  async get(id: UUID): Promise<Report> {
    const row = await queryOne<Report>(
      `SELECT * FROM public.reports WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Report not found');
    return row;
  },

  async create(input: CreateReportInput): Promise<Report> {
    const { scan_id, client_id, title_en, title_ar, language = 'bilingual' } = input;
    const row = await queryOne<Report>(
      `INSERT INTO public.reports (scan_id, client_id, title_en, title_ar, language)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [scan_id, client_id, title_en, title_ar, language],
    );
    if (!row) throw new HttpError(500, 'Failed to create report');
    return row;
  },

  async markDelivered(id: UUID, storage_path: string): Promise<Report> {
    const row = await queryOne<Report>(
      `UPDATE public.reports
       SET status = 'delivered', storage_path = $2, delivered_at = now()
       WHERE id = $1 RETURNING *`,
      [id, storage_path],
    );
    if (!row) throw new HttpError(404, 'Report not found');
    return row;
  },
};
