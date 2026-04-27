import type { Client, CreateClientInput, UpdateClientInput, UUID } from '@mizan/shared-types';
import { supabase } from '../lib/supabase.js';
import { HttpError } from '../middleware/error.js';

const TABLE = 'clients';

export const clientsService = {
  async list(): Promise<Client[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data ?? []) as Client[];
  },

  async get(id: UUID): Promise<Client> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, 'Client not found');
    return data as Client;
  },

  async create(input: CreateClientInput): Promise<Client> {
    const { data, error } = await supabase.from(TABLE).insert(input).select('*').single();
    if (error) throw new HttpError(400, error.message);
    return data as Client;
  },

  async update(id: UUID, input: UpdateClientInput): Promise<Client> {
    const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select('*').single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Client not found');
    return data as Client;
  },

  async remove(id: UUID): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new HttpError(400, error.message);
  },
};
