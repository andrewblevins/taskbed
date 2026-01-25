/**
 * Script to mark tasks from Things "Someday" list with status: 'someday' in Taskbed
 *
 * Usage:
 *   1. Set environment variables:
 *      export SUPABASE_URL=https://your-project.supabase.co
 *      export SUPABASE_SERVICE_KEY=your-service-key
 *      export USER_ID=your-user-id
 *
 *   2. Run with tsx:
 *      npx tsx scripts/mark-someday-tasks.ts
 */

import { createClient } from '@supabase/supabase-js';

// Tasks from Things "Someday" list (titles to match)
const SOMEDAY_TASK_TITLES = [
  "Transcripts That Don't Suck app money-making idea",
  "Buy a cheap printer and a table for it",
  "Read ThredUp's website (to see if it makes sense as a way of getting rid of used clothing)",
  "Order a bidet",
  "Continue Saturday Seances?",
  "Buy a skateboard",
  "Percy Liang Stanford persona data set",
  "Reach out to Jasen Murray",
  "Context Appreciation Society merchandise",
  "Make a meditation app",
  "Make \"Are You Context-Aware?\" t-shirts, badges",
  "Access to Fools",
  "Screenplay/novel: male-brained autist escort a la Aella / Romy is pulled into a web of intrigue",
  "Partiful app that shows what events are missing in the ecosystem",
  "Do something with the 1-minute videos",
  "Go to The Word Is Change bookstore and use gift certificate",
  "Facilitate a Gesar empowerment for sit group",
  "Improve media diet for finding out about art, theatre, books, etc.",
  "Buy a printer or find a good solution for printing things",
  "Explore LLMs for applied Kegan",
  "Memory aids for people with dementia",
  "Get the Brooklyn borough historian to come and do a talk at Fractal Tech",
  "Buy an iPad",
  "Have a conversation with LLM about my ears",
  "Get GTD workflow printed and framed",
  "Check whether it's worth it / important to get my pineal cyst looked at",
  "Make a list of people to do recurring check-ins with",
  "Tinder for yidams project",
];

interface Task {
  id: string;
  title: string;
  status: string;
  completed: boolean;
  [key: string]: unknown;
}

interface TaskbedState {
  tasks: Task[];
  [key: string]: unknown;
}

async function markSomedayTasks() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const userId = process.env.USER_ID;

  if (!supabaseUrl || !supabaseKey || !userId) {
    console.error('Error: Missing environment variables');
    console.error('Please set SUPABASE_URL, SUPABASE_SERVICE_KEY, and USER_ID');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch current state
  console.log(`Fetching data for user: ${userId}...`);
  const { data, error: fetchError } = await supabase
    .from('taskbed_state')
    .select('state')
    .eq('user_id', userId)
    .single();

  if (fetchError || !data?.state) {
    console.error('Error fetching data:', fetchError?.message || 'No data found');
    process.exit(1);
  }

  const state = data.state as TaskbedState;
  console.log(`Found ${state.tasks.length} tasks`);

  // Create a set of lowercase titles for matching
  const somedayTitlesLower = new Set(SOMEDAY_TASK_TITLES.map(t => t.toLowerCase()));

  // Update tasks
  let updatedCount = 0;
  let alreadySomedayCount = 0;
  const notFoundTitles: string[] = [];

  const updatedTasks = state.tasks.map(task => {
    if (somedayTitlesLower.has(task.title.toLowerCase())) {
      if (task.status === 'someday') {
        alreadySomedayCount++;
        return task;
      }
      updatedCount++;
      console.log(`  Marking as someday: "${task.title}"`);
      return { ...task, status: 'someday' };
    }
    return task;
  });

  // Check which titles weren't found
  const foundTitlesLower = new Set(state.tasks.map(t => t.title.toLowerCase()));
  for (const title of SOMEDAY_TASK_TITLES) {
    if (!foundTitlesLower.has(title.toLowerCase())) {
      notFoundTitles.push(title);
    }
  }

  if (notFoundTitles.length > 0) {
    console.log(`\nWarning: ${notFoundTitles.length} tasks not found in Taskbed:`);
    notFoundTitles.forEach(t => console.log(`  - "${t}"`));
  }

  if (updatedCount === 0) {
    console.log(`\nNo tasks needed updating (${alreadySomedayCount} already marked as someday)`);
    return;
  }

  // Save updated state
  console.log(`\nUpdating ${updatedCount} tasks...`);
  const updatedState = { ...state, tasks: updatedTasks };

  const { error: updateError } = await supabase
    .from('taskbed_state')
    .update({
      state: updatedState,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating data:', updateError.message);
    process.exit(1);
  }

  console.log(`Done! Marked ${updatedCount} tasks as someday.`);
  if (alreadySomedayCount > 0) {
    console.log(`(${alreadySomedayCount} were already marked as someday)`);
  }
}

markSomedayTasks().catch(console.error);
