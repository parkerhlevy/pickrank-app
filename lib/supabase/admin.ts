import { createClient } from '@supabase/supabase-js';
import { getServiceRoleSupabaseConfig } from '@/lib/env';
import type { Database } from './types';

export function createAdminClient() {
  const { url, serviceRoleKey } = getServiceRoleSupabaseConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
