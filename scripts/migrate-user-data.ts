/**
 * Migration script to move data from 'default' user to your authenticated user ID
 *
 * Usage:
 *   1. Sign up in the web app
 *   2. Get your user ID from Supabase dashboard (Auth > Users)
 *   3. Run:
 *      SUPABASE_URL=https://xxx.supabase.co \
 *      SUPABASE_SERVICE_KEY=your-service-key \
 *      NEW_USER_ID=your-auth-user-id \
 *      npx tsx scripts/migrate-user-data.ts
 */

import { createClient } from '@supabase/supabase-js';

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const newUserId = process.env.NEW_USER_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!newUserId) {
    console.error('Error: Missing NEW_USER_ID');
    console.error('Get your user ID from Supabase dashboard: Auth > Users');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch existing 'default' user data
  console.log("Fetching data from 'default' user...");
  const { data: defaultData, error: fetchError } = await supabase
    .from('taskbed_state')
    .select('state')
    .eq('user_id', 'default')
    .single();

  if (fetchError) {
    console.error('Error fetching default data:', fetchError.message);
    process.exit(1);
  }

  if (!defaultData?.state) {
    console.error("No data found for 'default' user");
    process.exit(1);
  }

  console.log('Found data. Migrating to user:', newUserId);

  // Insert/update data for new user ID
  const { error: upsertError } = await supabase
    .from('taskbed_state')
    .upsert(
      {
        user_id: newUserId,
        state: defaultData.state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('Error migrating data:', upsertError.message);
    process.exit(1);
  }

  console.log('Migration complete!');
  console.log(`Data copied from 'default' to '${newUserId}'`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Add USER_ID=${newUserId} to mcp-server/.env`);
  console.log('2. Optionally delete the old default row from Supabase');
}

migrate().catch(console.error);
