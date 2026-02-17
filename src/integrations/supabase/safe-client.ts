// Safe Supabase client wrapper - prevents crash when env vars are missing
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabaseSafe: SupabaseClient<Database> | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabaseSafe = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export { supabaseSafe };
