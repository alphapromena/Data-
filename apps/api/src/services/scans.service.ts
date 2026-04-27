import type { CreateScanInput, Scan, UpdateScanInput, UUID } from '@mizan/shared-types';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../middleware/error.js';

const TABLE = 'scans';

export const scansService = {
  async list(filters?: { client_id?: UUID }): Promise<Scan[]> {
    let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (filters?.client_id) q = q.eq('client_id', filters.client_id);
    const { data, error } = await q;
    if (error) throw new HttpError(500, error.message);
    return (data ?? []) as Scan[];
  },

  async get(id: UUID): Promise<Scan> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, 'Scan not found');
    return data as Scan;
  },

  async create(input: CreateScanInput): Promise<Scan> {
    const { data, error } = await supabase.from(TABLE).insert(input).select('*').single();
    if (error) throw new HttpError(400, error.message);
    return data as Scan;
  },

  async update(id: UUID, input: UpdateScanInput): Promise<Scan> {
    const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select('*').single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Scan not found');
    return data as Scan;
  },

  async remove(id: UUID): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new HttpError(400, error.message);
  },
};
