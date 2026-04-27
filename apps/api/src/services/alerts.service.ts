import type { UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

export interface Alert {
  id: string;
  client_id: string;
  scan_id: string | null;
  data_source_id: string | null;
  severity: string;
  title_en: string;
  title_ar: string;
  message_en: string | null;
  message_ar: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CreateAlertInput {
  client_id: UUID;
  scan_id?: UUID;
  data_source_id?: UUID;
  severity?: 'info' | 'warning' | 'critical';
  title_en: string;
  title_ar: string;
  message_en?: string;
  message_ar?: string;
  payload?: Record<string, unknown>;
}

export const alertsService = {
  async listByClient(client_id: UUID, unacknowledged = false): Promise<Alert[]> {
    const base = `SELECT * FROM public.alerts WHERE client_id = $1`;
    const filter = unacknowledged ? ` AND is_acknowledged = false` : '';
    return query<Alert>(`${base}${filter} ORDER BY created_at DESC`, [client_id]);
  },

  async get(id: UUID): Promise<Alert> {
    const row = await queryOne<Alert>(
      `SELECT * FROM public.alerts WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Alert not found');
    return row;
  },

  async create(input: CreateAlertInput): Promise<Alert> {
    const {
      client_id, scan_id, data_source_id, severity = 'info',
      title_en, title_ar, message_en, message_ar, payload = {},
    } = input;
    const row = await queryOne<Alert>(
      `INSERT INTO public.alerts
         (client_id, scan_id, data_source_id, severity, title_en, title_ar,
          message_en, message_ar, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        client_id, scan_id ?? null, data_source_id ?? null, severity,
        title_en, title_ar, message_en ?? null, message_ar ?? null,
        JSON.stringify(payload),
      ],
    );
    if (!row) throw new HttpError(500, 'Failed to create alert');
    return row;
  },

  async acknowledge(id: UUID, user_id: UUID): Promise<Alert> {
    const row = await queryOne<Alert>(
      `UPDATE public.alerts
       SET is_acknowledged = true, acknowledged_by = $2, acknowledged_at = now()
       WHERE id = $1 RETURNING *`,
      [id, user_id],
    );
    if (!row) throw new HttpError(404, 'Alert not found');
    return row;
  },
};
