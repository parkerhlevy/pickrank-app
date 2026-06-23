import { createBrowserClient } from '@supabase/ssr';
import { getBrowserSupabaseConfig } from '@/lib/env';
import type { Database } from './types';

export function createClient() {
  const { url, anonKey } = getBrowserSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey);
}
