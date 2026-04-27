import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Server-side Supabase client. Uses the service-role key — bypasses RLS.
// Never import this from any code path that runs in the browser.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-mizan-component': 'api' } },
});
