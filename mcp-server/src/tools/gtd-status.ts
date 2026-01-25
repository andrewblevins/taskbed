import { loadData, updateData } from '../data.js';

// Defer task to Someday/Maybe
export async function deferToSomeday(id: string): Promise<string> {
  const state = await loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  if (task.status === 'someday') {
    return `Task "${task.title}" is already in Someday/Maybe.`;
  }

  await updateData(s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            status: 'someday' as const,
            waitingFor: undefined,
            waitingSince: undefined,
          }
        : t
    ),
  }));

  return `Moved task to Someday/Maybe: "${task.title}"`;
}

// Move task to Waiting For
export async function moveToWaiting(id: string, waitingFor: string): Promise<string> {
  const state = await loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  if (!waitingFor.trim()) {
    return 'Please specify who or what you are waiting for.';
  }

  await updateData(s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            status: 'waiting' as const,
            waitingFor: waitingFor.trim(),
            waitingSince: Date.now(),
          }
        : t
    ),
  }));

  return `Moved task to Waiting For (${waitingFor}): "${task.title}"`;
}

// Activate task (move back to Active)
export async function activateTask(id: string): Promise<string> {
  const state = await loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  if (task.status === 'active') {
    return `Task "${task.title}" is already active.`;
  }

  await updateData(s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            status: 'active' as const,
            waitingFor: undefined,
            waitingSince: undefined,
          }
        : t
    ),
  }));

  const previousStatus = task.status === 'someday' ? 'Someday/Maybe' : `Waiting For (${task.waitingFor})`;
  return `Activated task (was ${previousStatus}): "${task.title}"`;
}
