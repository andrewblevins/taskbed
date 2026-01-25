import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await supabase.from('taskbed_state').select('user_id');
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('User IDs in database:', data?.map(d => d.user_id));
}

main();
