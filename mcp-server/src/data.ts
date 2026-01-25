import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { TaskbedState } from './types.js';
import { defaultState } from './types.js';

// Load environment variables
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the shared data file (same as main app's server.js)
const DATA_FILE = join(__dirname, '..', '..', 'data', 'taskbed.json');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Supabase client - only created if credentials are configured
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const DEFAULT_USER_ID = 'default';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => supabase !== null;

/**
 * Load the current state from Supabase (primary) or taskbed.json (fallback)
 * Returns default state if neither source has data
 */
export async function loadData(): Promise<TaskbedState> {
  // Try Supabase first
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('taskbed_state')
        .select('state')
        .eq('user_id', DEFAULT_USER_ID)
        .single();

      if (!error && data?.state) {
        console.error('Loaded data from Supabase');
        return data.state as TaskbedState;
      }
    } catch (err) {
      console.error('Supabase load failed, falling back to file:', err);
    }
  }

  // Fall back to local file
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // The file stores { state: TaskbedState } from zustand persist
      if (parsed?.state) {
        console.error('Loaded data from local file');
        return parsed.state;
      }
      return defaultState;
    }
  } catch (error) {
    console.error('Error loading data from file:', error);
  }
  return defaultState;
}

/**
 * Load data synchronously from file only (for backwards compatibility)
 * Use loadData() async version when possible
 */
export function loadDataSync(): TaskbedState {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        return parsed.state;
      }
      return defaultState;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultState;
}

/**
 * Save state to Supabase (primary) and taskbed.json (backup)
 * Wraps in { state: ... } to match zustand persist format for file
 */
export async function saveData(state: TaskbedState): Promise<void> {
  const errors: Error[] = [];

  // Save to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('taskbed_state')
        .upsert(
          {
            user_id: DEFAULT_USER_ID,
            state: state,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        errors.push(new Error(`Supabase save error: ${error.message}`));
      } else {
        console.error('Saved to Supabase');
      }
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Also save to local file (backup/offline support)
  try {
    const dir = dirname(DATA_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const data = { state };
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.error('Saved to local file');
  } catch (err) {
    errors.push(err instanceof Error ? err : new Error(String(err)));
  }

  // If both failed, throw
  if (errors.length === 2 || (!isSupabaseConfigured() && errors.length === 1)) {
    throw errors[0];
  }
}

/**
 * Save data synchronously to file only (for backwards compatibility)
 */
export function saveDataSync(state: TaskbedState): void {
  try {
    const dir = dirname(DATA_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const data = { state };
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

/**
 * Helper to update state with a transform function
 */
export async function updateData(transform: (state: TaskbedState) => TaskbedState): Promise<TaskbedState> {
  const current = await loadData();
  const updated = transform(current);
  await saveData(updated);
  return updated;
}

/**
 * Synchronous version for backwards compatibility
 */
export function updateDataSync(transform: (state: TaskbedState) => TaskbedState): TaskbedState {
  const current = loadDataSync();
  const updated = transform(current);
  saveDataSync(updated);
  return updated;
}
