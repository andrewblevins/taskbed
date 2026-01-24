import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { TaskbedState } from './types.js';
import { defaultState } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the shared data file (same as main app's server.js)
const DATA_FILE = join(__dirname, '..', '..', 'data', 'taskbed.json');

/**
 * Load the current state from taskbed.json
 * Returns default state if file doesn't exist
 */
export function loadData(): TaskbedState {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // The file stores { state: TaskbedState } from zustand persist
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
 * Save state to taskbed.json
 * Wraps in { state: ... } to match zustand persist format
 */
export function saveData(state: TaskbedState): void {
  try {
    // Ensure data directory exists
    const dir = dirname(DATA_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Save in zustand persist format
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
export function updateData(transform: (state: TaskbedState) => TaskbedState): TaskbedState {
  const current = loadData();
  const updated = transform(current);
  saveData(updated);
  return updated;
}
