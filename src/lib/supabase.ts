import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Defensive: if env vars are missing, create a dummy client that won't crash the app
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error(
        'Missing Supabase environment variables. VITE_SUPABASE_URL:',
        supabaseUrl ? 'SET' : 'MISSING',
        'VITE_SUPABASE_ANON_KEY:',
        supabaseAnonKey ? 'SET' : 'MISSING'
    );
    // Create with placeholder to prevent crash; auth will simply not work
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
