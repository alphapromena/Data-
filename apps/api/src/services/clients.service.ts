import type { Client, CreateClientInput, UpdateClientInput, UUID } from '@mizan/shared-types';
import { query, queryOne } from '../lib/db.js';
import { HttpError } from '../middleware/error.js';

export const clientsService = {
  async list(): Promise<Client[]> {
    return query<Client>(`SELECT * FROM public.clients ORDER BY created_at DESC`);
  },

  async get(id: UUID): Promise<Client> {
    const row = await queryOne<Client>(
      `SELECT * FROM public.clients WHERE id = $1`, [id],
    );
    if (!row) throw new HttpError(404, 'Client not found');
    return row;
  },

  async create(input: CreateClientInput): Promise<Client> {
    const {
      name_en, name_ar, industry, country_code = 'SA',
      contact_email, contact_phone, stage = 'scan', metadata = {},
    } = input;
    const row = await queryOne<Client>(
      `INSERT INTO public.clients
         (name_en, name_ar, industry, country_code, contact_email, contact_phone, stage, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name_en, name_ar, industry ?? null, country_code, contact_email ?? null,
       contact_phone ?? null, stage, JSON.stringify(metadata)],
    );
    if (!row) throw new HttpError(500, 'Failed to create client');
    return row;
  },

  async update(id: UUID, input: UpdateClientInput): Promise<Client> {
    const fields = Object.entries(input).filter(([, v]) => v !== undefined);
    if (fields.length === 0) throw new HttpError(400, 'No fields to update');
    const setClauses = fields.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) =>
      typeof v === 'object' && v !== null ? JSON.stringify(v) : v,
    );
    const row = await queryOne<Client>(
      `UPDATE public.clients SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) throw new HttpError(404, 'Client not found');
    return row;
  },

  async remove(id: UUID): Promise<void> {
    await query(`DELETE FROM public.clients WHERE id = $1`, [id]);
  },
};
