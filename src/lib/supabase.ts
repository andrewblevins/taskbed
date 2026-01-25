import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

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

// Auth helper functions
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) return { user: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error: error?.message ?? null };
}

export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) return { user: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user ?? null, error: error?.message ?? null };
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

export async function getCurrentSession(): Promise<{ session: Session | null; error: string | null }> {
  if (!supabase) return { session: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session ?? null, error: error?.message ?? null };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}
