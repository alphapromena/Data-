import type { CreateScanInput, Scan, UpdateScanInput, UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

export const scansService = {
  async list(filters?: { client_id?: UUID }): Promise<Scan[]> {
    if (filters?.client_id) {
      return query<Scan>(
        `SELECT * FROM public.scans WHERE client_id = $1 ORDER BY created_at DESC`,
        [filters.client_id],
      );
    }
    return query<Scan>(`SELECT * FROM public.scans ORDER BY created_at DESC`);
  },

  async get(id: UUID): Promise<Scan> {
    const row = await queryOne<Scan>(
      `SELECT * FROM public.scans WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Scan not found');
    return row;
  },

  async create(input: CreateScanInput): Promise<Scan> {
    const { client_id, data_source_id, stage = 'scan', config = {} } = input;
    const row = await queryOne<Scan>(
      `INSERT INTO public.scans (client_id, data_source_id, stage, config)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [client_id, data_source_id, stage, JSON.stringify(config)],
    );
    if (!row) throw new HttpError(500, 'Failed to create scan');
    return row;
  },

  async update(id: UUID, input: UpdateScanInput): Promise<Scan> {
    const fields = Object.entries(input).filter(([, v]) => v !== undefined);
    if (fields.length === 0) throw new HttpError(400, 'No fields to update');
    const setClauses = fields.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) =>
      typeof v === 'object' && v !== null ? JSON.stringify(v) : v,
    );
    const row = await queryOne<Scan>(
      `UPDATE public.scans SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) throw new HttpError(404, 'Scan not found');
    return row;
  },

  async remove(id: UUID): Promise<void> {
    await query(`DELETE FROM public.scans WHERE id = $1`, [id]);
  },
};
