
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Status export to help the UI handle missing configuration gracefully
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// We provide placeholders to prevent the constructor from throwing an immediate error
// actual calls will fail with a 401/404 if these are used, which is handled in the UI
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
