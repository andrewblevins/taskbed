import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Task {
  id: string;
  title: string;
  status?: string;
  completed?: boolean;
}

interface State {
  tasks?: Task[];
}

async function main() {
  const { data, error } = await supabase.from('taskbed_state').select('user_id, state');
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  for (const row of data || []) {
    const state = row.state as State;
    const allTasks = state?.tasks || [];
    const somedayTasks = allTasks.filter(t => t.status === 'someday' && !t.completed);
    const activeTasks = allTasks.filter(t => (t.status === 'active' || !t.status) && !t.completed);

    console.log('User:', row.user_id);
    console.log('Total tasks:', allTasks.length);
    console.log('Active tasks:', activeTasks.length);
    console.log('Someday tasks:', somedayTasks.length);

    if (somedayTasks.length > 0) {
      console.log('Someday titles:');
      somedayTasks.forEach(t => console.log('  -', t.title));
    } else {
      // Check if any tasks have "someday" in title that might match Things
      const possibleSomeday = allTasks.filter(t =>
        t.title.toLowerCase().includes('someday') ||
        t.title.toLowerCase().includes('maybe')
      );
      if (possibleSomeday.length > 0) {
        console.log('Tasks with someday/maybe in title:', possibleSomeday.map(t => t.title));
      }
    }
    console.log('---');
  }
}

main();
