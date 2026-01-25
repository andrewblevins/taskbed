import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client - only created if credentials are configured
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Database types for the taskbed_state table
export interface TaskbedStateRow {
  id: string;
  user_id: string;
  state: Record<string, unknown>;
  updated_at: string;
}

// Default user ID (for future multi-user support)
export const DEFAULT_USER_ID = 'default';
