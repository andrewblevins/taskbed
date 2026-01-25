/**
 * Migration script to upload existing taskbed.json data to Supabase
 *
 * Usage:
 *   1. Set environment variables:
 *      export SUPABASE_URL=https://your-project.supabase.co
 *      export SUPABASE_SERVICE_KEY=your-service-key
 *
 *   2. Run with ts-node or tsx:
 *      npx tsx scripts/migrate-to-supabase.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '..', 'data', 'taskbed.json');
const DEFAULT_USER_ID = 'default';

async function migrate() {
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Check if data file exists
  if (!existsSync(DATA_FILE)) {
    console.error(`Error: Data file not found at ${DATA_FILE}`);
    process.exit(1);
  }

  // Read existing data
  console.log(`Reading data from ${DATA_FILE}...`);
  const raw = readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed?.state) {
    console.error('Error: Invalid data format (expected { state: ... })');
    process.exit(1);
  }

  const state = parsed.state;
  console.log(`Found ${state.tasks?.length || 0} tasks, ${state.projects?.length || 0} projects`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Upload to Supabase
  console.log('Uploading to Supabase...');
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
    console.error('Error uploading to Supabase:', error.message);
    process.exit(1);
  }

  console.log('Migration complete!');
  console.log(`Data successfully uploaded for user_id: ${DEFAULT_USER_ID}`);
}

migrate().catch(console.error);
