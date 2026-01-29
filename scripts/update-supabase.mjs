import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://zoxucsgzunykrtxelmjh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveHVjc2d6dW55a3J0eGVsbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyNjk4NiwiZXhwIjoyMDg0OTAyOTg2fQ.40iDCENlcIHQnSO5xLDuw35qNhYfT30X3F9BKwaPzmE'
);

async function main() {
  // Read the corrected data
  const fileData = JSON.parse(readFileSync('/Users/andrew/taskbed/data/taskbed.json', 'utf-8'));

  // First, get the user_id from existing data
  const { data: existing, error: fetchError } = await supabase
    .from('taskbed_state')
    .select('user_id')
    .limit(1);

  if (fetchError) {
    console.error('Fetch error:', fetchError.message);
    return;
  }

  if (!existing || existing.length === 0) {
    console.error('No existing user found in taskbed_state');
    return;
  }

  const userId = existing[0].user_id;
  console.log('Updating data for user:', userId);

  // Count someday items
  const somedayTasks = fileData.state.tasks.filter(t => t.status === 'someday').length;
  const somedayProjects = fileData.state.projects.filter(p => p.status === 'someday').length;
  console.log('Someday tasks:', somedayTasks);
  console.log('Someday projects:', somedayProjects);

  // Update with corrected data
  const { error: updateError } = await supabase
    .from('taskbed_state')
    .upsert({
      user_id: userId,
      state: fileData.state,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (updateError) {
    console.error('Update error:', updateError.message);
    return;
  }

  console.log('Successfully updated Supabase!');
  console.log('Your browser should receive the update via realtime sync.');
}

main();
