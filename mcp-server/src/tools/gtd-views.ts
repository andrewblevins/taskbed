import { loadData } from '../data.js';
import type { Task } from '../types.js';

// Helper to format task list
function formatTaskList(tasks: Task[], projectMap: Map<string, string>): string {
  if (tasks.length === 0) {
    return 'No tasks found.';
  }

  const lines = tasks.map(t => {
    const parts: string[] = [];
    const status = t.completed ? '[x]' : '[ ]';
    parts.push(`${status} ${t.title}`);

    const meta: string[] = [];
    const projectName = t.projectId ? projectMap.get(t.projectId) : undefined;
    if (projectName) meta.push(`Project: ${projectName}`);
    if (t.tags?.length) meta.push(`Tags: ${t.tags.join(', ')}`);
    if (t.dueDate) {
      const due = new Date(t.dueDate);
      const now = new Date();
      const isOverdue = due < now && !t.completed;
      meta.push(`Due: ${due.toLocaleDateString()}${isOverdue ? ' (OVERDUE)' : ''}`);
    }
    if (t.attributes?.energy) meta.push(`Energy: ${t.attributes.energy}`);
    if (t.waitingFor) meta.push(`Waiting for: ${t.waitingFor}`);

    if (meta.length) {
      parts.push(`   ${meta.join(' | ')}`);
    }

    return parts.join('\n');
  });

  return `Found ${tasks.length} task(s):\n\n${lines.join('\n\n')}`;
}

// Get inbox: active tasks with no project (unprocessed in GTD terms)
export async function getInbox(): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  const inbox = state.tasks.filter(
    t => !t.completed && t.status === 'active' && !t.projectId
  );

  if (inbox.length === 0) {
    return 'Inbox is empty. All active tasks have been assigned to projects.';
  }

  return `Inbox (unprocessed tasks):\n\n${formatTaskList(inbox, projectMap)}`;
}

// Get next actions: active tasks, optionally filtered by context tag
export async function getNextActions(tag?: string): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  let tasks = state.tasks.filter(t => !t.completed && t.status === 'active');

  if (tag) {
    const normalizedTag = tag.startsWith('@') ? tag : `@${tag}`;
    tasks = tasks.filter(t => t.tags?.includes(normalizedTag));
  }

  const header = tag
    ? `Next Actions (${tag.startsWith('@') ? tag : '@' + tag}):`
    : 'All Next Actions:';

  return `${header}\n\n${formatTaskList(tasks, projectMap)}`;
}

// Get waiting for list
export async function getWaitingFor(): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  const waiting = state.tasks.filter(t => !t.completed && t.status === 'waiting');

  // Sort by waiting duration (oldest first)
  waiting.sort((a, b) => (a.waitingSince || 0) - (b.waitingSince || 0));

  if (waiting.length === 0) {
    return 'No tasks in Waiting For list.';
  }

  // Custom format to show waiting info
  const lines = waiting.map(t => {
    const parts: string[] = [];
    parts.push(`[ ] ${t.title}`);

    const meta: string[] = [];
    meta.push(`Waiting for: ${t.waitingFor || 'someone'}`);

    if (t.waitingSince) {
      const days = Math.floor((Date.now() - t.waitingSince) / (1000 * 60 * 60 * 24));
      meta.push(`Since: ${days} day(s)`);
    }

    const projectName = t.projectId ? projectMap.get(t.projectId) : undefined;
    if (projectName) meta.push(`Project: ${projectName}`);

    parts.push(`   ${meta.join(' | ')}`);
    return parts.join('\n');
  });

  return `Waiting For list (${waiting.length} items):\n\n${lines.join('\n\n')}`;
}

// Get someday/maybe list
export async function getSomeday(): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  const someday = state.tasks.filter(t => !t.completed && t.status === 'someday');

  if (someday.length === 0) {
    return 'No tasks in Someday/Maybe list.';
  }

  return `Someday/Maybe list:\n\n${formatTaskList(someday, projectMap)}`;
}

// Get tasks due soon (within N days)
export async function getDueSoon(days: number = 7): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  const now = Date.now();
  const cutoff = now + days * 24 * 60 * 60 * 1000;

  const dueSoon = state.tasks.filter(
    t => !t.completed && t.dueDate && t.dueDate <= cutoff && t.dueDate >= now
  );

  // Sort by due date
  dueSoon.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  if (dueSoon.length === 0) {
    return `No tasks due within the next ${days} day(s).`;
  }

  return `Tasks due within ${days} day(s):\n\n${formatTaskList(dueSoon, projectMap)}`;
}

// Get overdue tasks
export async function getOverdue(): Promise<string> {
  const state = await loadData();
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  const now = Date.now();

  const overdue = state.tasks.filter(
    t => !t.completed && t.dueDate && t.dueDate < now
  );

  // Sort by most overdue first
  overdue.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  if (overdue.length === 0) {
    return 'No overdue tasks. Great job staying on top of deadlines!';
  }

  return `Overdue tasks (${overdue.length}):\n\n${formatTaskList(overdue, projectMap)}`;
}
