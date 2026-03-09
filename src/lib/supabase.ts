import { createClient } from '@supabase/supabase-js';

// Supabase public credentials (anon key is safe for client-side, RLS protects data)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://szpekomednjgisjdawie.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_j0kHAADKDAzeYHkkj5K2nw_TJ9fXCA3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

