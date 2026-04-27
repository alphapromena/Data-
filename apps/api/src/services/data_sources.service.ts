import type { UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

export interface DataSource {
  id: string;
  client_id: string;
  name: string;
  kind: string;
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
  kind: 'postgres' | 'mysql' | 'mssql' | 'oracle' | 'sap_hana' | 'excel' | 'csv';
  connection_config?: Record<string, unknown>;
  secret_ref?: string;
}

export const dataSourcesService = {
  async list(client_id?: UUID): Promise<DataSource[]> {
    if (client_id) {
      return query<DataSource>(
        `SELECT * FROM public.data_sources WHERE client_id = $1 ORDER BY created_at DESC`,
        [client_id],
      );
    }
    return query<DataSource>(`SELECT * FROM public.data_sources ORDER BY created_at DESC`);
  },

  async get(id: UUID): Promise<DataSource> {
    const row = await queryOne<DataSource>(
      `SELECT * FROM public.data_sources WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Data source not found');
    return row;
  },

  async create(input: CreateDataSourceInput): Promise<DataSource> {
    const { client_id, name, kind, connection_config = {}, secret_ref } = input;
    const row = await queryOne<DataSource>(
      `INSERT INTO public.data_sources (client_id, name, kind, connection_config, secret_ref)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [client_id, name, kind, JSON.stringify(connection_config), secret_ref ?? null],
    );
    if (!row) throw new HttpError(500, 'Failed to create data source');
    return row;
  },

  async update(id: UUID, input: Partial<CreateDataSourceInput>): Promise<DataSource> {
    const fields = Object.entries(input).filter(([, v]) => v !== undefined);
    if (fields.length === 0) throw new HttpError(400, 'No fields to update');
    const setClauses = fields.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) =>
      typeof v === 'object' && v !== null ? JSON.stringify(v) : v,
    );
    const row = await queryOne<DataSource>(
      `UPDATE public.data_sources SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) throw new HttpError(404, 'Data source not found');
    return row;
  },

  async remove(id: UUID): Promise<void> {
    await query(`DELETE FROM public.data_sources WHERE id = $1`, [id]);
  },
};
