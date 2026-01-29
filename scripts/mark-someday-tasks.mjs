#!/usr/bin/env node

/**
 * Script to mark tasks from Things "Someday" list with status: 'someday' in Taskbed
 * Run with: node scripts/mark-someday-tasks.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// IDs from Things "Someday" list (tasks)
const somedayTaskIds = [
  'FnyXyXAnn6zK93CbQFPJBN',
  'E72C9soYPcFybxdkJhYhnK',
  'Rkpw5Cmg6WQ5ACs2BYZWze',
  'KoLZ5cV93KLZDwVTDKwyEk',
  'UdMcykmMBBjtPoFwPir4KC',
  'UmM7WwCQ9wFx1AxJ7XpfGQ',
  'RusKjHyB18Mx4osuCL1zUt',
  '4QksRCJ6YsHxAPX9r6bkwW',
  'LNPHzFhbocvWsGTwC1LBQS',
  '2NQGa9QGKVCEq4A3AMuJV9',
  'TwVDQgVwouncuse77AbaLd',
  'LYh6KBjUM2mRgeNfjX7mQw',
  'EEfdmJTYKPpTkZph1bWpfi',
  '98NncRcnkSFThWpgcrEM34',
  'P2qhr7bCxn5fu9Tn2A3g98',
  'NVQKTFY1WwxFBot9NxWuqg',
  '3AL6mzGNmgVApnBGix7au8',
  'EECka3kYdpFgrSNJjV5oCq',
  'S8jfGBjmzxonjsBDPeg2av',
  'K2JPCN55xfRA8R5UtEPGYL',
  '891yq4shVo1LZgbbCDGMGM',
  '79zDCbe9gbzYLgLc9Hdqoe',
  'WvfvvDnSdVt84PuQnGMcES',
  'EXVbxoWya425zugffuuasN',
  '5bRqyKp1oLa9rdeHwBCKXM',
  '7spRhbgiFDwmr8Kt8Ja4ia',
];

// Projects that are in Someday - these need status: 'someday' on the project
const somedayProjectIds = [
  '5PE4CXghxxBz3QPLvt6win', // Facilitate a Gesar empowerment for sit group
  'CkU1RaVG7ETuRTKWA4WMit', // Explore LLMs for applied Kegan
];

// When running from taskbed directory, __dirname will be taskbed/scripts
// So we go up one level to get to taskbed, then into data
const scriptDir = dirname(__filename);
const projectRoot = dirname(scriptDir);
const dataFile = join(projectRoot, 'data', 'taskbed.json');

console.log('Data file path:', dataFile);

try {
  const raw = readFileSync(dataFile, 'utf-8');
  const data = JSON.parse(raw);

  let tasksUpdated = 0;
  let projectsUpdated = 0;

  // Update tasks
  data.state.tasks = data.state.tasks.map(task => {
    if (somedayTaskIds.includes(task.id)) {
      tasksUpdated++;
      return { ...task, status: 'someday' };
    }
    // If no status, default to 'active'
    if (!task.status) {
      return { ...task, status: 'active' };
    }
    return task;
  });

  // Update projects (projects use status field too)
  data.state.projects = data.state.projects.map(project => {
    if (somedayProjectIds.includes(project.id)) {
      projectsUpdated++;
      return { ...project, status: 'someday' };
    }
    // If no status, default to 'active'
    if (!project.status) {
      return { ...project, status: 'active' };
    }
    return project;
  });

  writeFileSync(dataFile, JSON.stringify(data, null, 2));

  console.log(`Updated ${tasksUpdated} tasks to status: 'someday'`);
  console.log(`Updated ${projectsUpdated} projects to status: 'someday'`);
  console.log(`All other tasks/projects without status set to 'active'`);
  console.log('');
  console.log('File saved. The app will sync to Supabase when you load it in the browser.');

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
