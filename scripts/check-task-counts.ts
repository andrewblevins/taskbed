import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await supabase.from('taskbed_state').select('user_id, state');
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  for (const row of data || []) {
    const state = row.state as { tasks?: unknown[], projects?: unknown[] };
    console.log(`User ${row.user_id}: ${state?.tasks?.length || 0} tasks, ${state?.projects?.length || 0} projects`);
  }
}

main();
