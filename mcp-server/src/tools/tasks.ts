import { v4 as uuid } from 'uuid';
import { loadData, updateData } from '../data.js';
import type { Task, TaskStatus } from '../types.js';

// Helper to format task for display
function formatTask(task: Task, projectName?: string): string {
  const parts: string[] = [];

  // Title with completion status
  const status = task.completed ? '[x]' : '[ ]';
  parts.push(`${status} ${task.title}`);

  // Meta info
  const meta: string[] = [];
  if (projectName) meta.push(`Project: ${projectName}`);
  if (task.status === 'someday') meta.push('(Someday/Maybe)');
  if (task.status === 'waiting') meta.push(`(Waiting for ${task.waitingFor || 'someone'})`);
  if (task.tags?.length) meta.push(`Tags: ${task.tags.join(', ')}`);
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const isOverdue = due < now && !task.completed;
    meta.push(`Due: ${due.toLocaleDateString()}${isOverdue ? ' (OVERDUE)' : ''}`);
  }
  if (task.attributes?.energy) meta.push(`Energy: ${task.attributes.energy}`);

  if (meta.length) {
    parts.push(`   ${meta.join(' | ')}`);
  }

  if (task.notes) {
    parts.push(`   Notes: ${task.notes.substring(0, 100)}${task.notes.length > 100 ? '...' : ''}`);
  }

  return parts.join('\n');
}

// List tasks with optional filters
export function listTasks(filters: {
  status?: TaskStatus;
  project?: string;
  tag?: string;
  completed?: boolean;
  has_due_date?: boolean;
  overdue?: boolean;
}): string {
  const state = loadData();
  let tasks = [...state.tasks];

  // Apply filters
  if (filters.status !== undefined) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters.completed !== undefined) {
    tasks = tasks.filter(t => t.completed === filters.completed);
  }
  if (filters.project !== undefined) {
    // Match by project ID or name
    const project = state.projects.find(
      p => p.id === filters.project || p.name.toLowerCase() === filters.project?.toLowerCase()
    );
    if (project) {
      tasks = tasks.filter(t => t.projectId === project.id);
    } else {
      tasks = tasks.filter(t => !t.projectId); // No project
    }
  }
  if (filters.tag !== undefined) {
    const tag = filters.tag.startsWith('@') ? filters.tag : `@${filters.tag}`;
    tasks = tasks.filter(t => t.tags?.includes(tag));
  }
  if (filters.has_due_date) {
    tasks = tasks.filter(t => t.dueDate !== undefined);
  }
  if (filters.overdue) {
    const now = Date.now();
    tasks = tasks.filter(t => t.dueDate && t.dueDate < now && !t.completed);
  }

  if (tasks.length === 0) {
    return 'No tasks found matching the criteria.';
  }

  // Create project lookup
  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  // Format output
  const lines = tasks.map(t => formatTask(t, t.projectId ? projectMap.get(t.projectId) : undefined));
  return `Found ${tasks.length} task(s):\n\n${lines.join('\n\n')}`;
}

// Get a single task by ID
export function getTask(id: string): string {
  const state = loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  const projectMap = new Map(state.projects.map(p => [p.id, p.name]));

  // More detailed output for single task
  const lines: string[] = [];
  lines.push(`ID: ${task.id}`);
  lines.push(`Title: ${task.title}`);
  lines.push(`Completed: ${task.completed ? 'Yes' : 'No'}`);
  lines.push(`Status: ${task.status}`);

  if (task.projectId) {
    lines.push(`Project: ${projectMap.get(task.projectId) || task.projectId}`);
  }
  if (task.notes) {
    lines.push(`Notes: ${task.notes}`);
  }
  if (task.tags?.length) {
    lines.push(`Tags: ${task.tags.join(', ')}`);
  }
  if (task.dueDate) {
    lines.push(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`);
  }
  if (task.attributes?.energy) {
    lines.push(`Energy: ${task.attributes.energy}`);
  }
  if (task.waitingFor) {
    lines.push(`Waiting For: ${task.waitingFor}`);
  }
  if (task.waitingSince) {
    lines.push(`Waiting Since: ${new Date(task.waitingSince).toLocaleDateString()}`);
  }
  lines.push(`Created: ${new Date(task.createdAt).toLocaleDateString()}`);

  return lines.join('\n');
}

// Add a new task
export function addTask(params: {
  title: string;
  notes?: string;
  project?: string;
  tags?: string[];
  status?: TaskStatus;
  due_date?: string;
  energy?: 'high' | 'medium' | 'low';
}): string {
  const state = loadData();

  // Resolve project ID
  let projectId: string | undefined;
  if (params.project) {
    const project = state.projects.find(
      p => p.id === params.project || p.name.toLowerCase() === params.project?.toLowerCase()
    );
    if (project) {
      projectId = project.id;
    }
  }

  // Parse due date
  let dueDate: number | undefined;
  if (params.due_date) {
    const parsed = new Date(params.due_date);
    if (!isNaN(parsed.getTime())) {
      // Set to end of day
      parsed.setHours(23, 59, 59, 999);
      dueDate = parsed.getTime();
    }
  }

  // Normalize tags
  const tags = (params.tags || []).map(t => t.startsWith('@') ? t : `@${t}`);

  const newTask: Task = {
    id: uuid(),
    title: params.title,
    notes: params.notes,
    completed: false,
    status: params.status || 'active',
    projectId,
    attributes: params.energy ? { energy: params.energy } : {},
    tags,
    createdAt: Date.now(),
  };

  if (dueDate) {
    newTask.dueDate = dueDate;
  }

  updateData(s => ({
    ...s,
    tasks: [...s.tasks, newTask],
    // Auto-add any new tags
    availableTags: [...new Set([...s.availableTags, ...tags])],
  }));

  return `Created task: "${params.title}" (ID: ${newTask.id})`;
}

// Update an existing task
export function updateTask(params: {
  id: string;
  title?: string;
  notes?: string;
  project?: string | null;
  tags?: string[];
  status?: TaskStatus;
  due_date?: string | null;
  energy?: 'high' | 'medium' | 'low' | null;
  waiting_for?: string;
}): string {
  const state = loadData();
  const taskIndex = state.tasks.findIndex(t => t.id === params.id);

  if (taskIndex === -1) {
    return `Task not found with ID: ${params.id}`;
  }

  const task = { ...state.tasks[taskIndex] };

  if (params.title !== undefined) task.title = params.title;
  if (params.notes !== undefined) task.notes = params.notes || undefined;

  // Handle project
  if (params.project !== undefined) {
    if (params.project === null || params.project === '') {
      task.projectId = undefined;
    } else {
      const project = state.projects.find(
        p => p.id === params.project || p.name.toLowerCase() === params.project?.toLowerCase()
      );
      if (project) {
        task.projectId = project.id;
      }
    }
  }

  // Handle tags
  if (params.tags !== undefined) {
    task.tags = params.tags.map(t => t.startsWith('@') ? t : `@${t}`);
  }

  // Handle status
  if (params.status !== undefined) {
    task.status = params.status;
    if (params.status !== 'waiting') {
      task.waitingFor = undefined;
      task.waitingSince = undefined;
    }
  }

  // Handle due date
  if (params.due_date !== undefined) {
    if (params.due_date === null || params.due_date === '') {
      task.dueDate = undefined;
    } else {
      const parsed = new Date(params.due_date);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(23, 59, 59, 999);
        task.dueDate = parsed.getTime();
      }
    }
  }

  // Handle energy
  if (params.energy !== undefined) {
    if (params.energy === null) {
      delete task.attributes.energy;
    } else {
      task.attributes = { ...task.attributes, energy: params.energy };
    }
  }

  // Handle waiting_for
  if (params.waiting_for !== undefined) {
    task.waitingFor = params.waiting_for;
    if (task.status !== 'waiting') {
      task.status = 'waiting';
      task.waitingSince = Date.now();
    }
  }

  updateData(s => ({
    ...s,
    tasks: s.tasks.map((t, i) => i === taskIndex ? task : t),
    availableTags: [...new Set([...s.availableTags, ...task.tags])],
  }));

  return `Updated task: "${task.title}"`;
}

// Complete a task
export function completeTask(id: string): string {
  const state = loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  if (task.completed) {
    return `Task "${task.title}" is already completed.`;
  }

  updateData(s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === id
        ? { ...t, completed: true, completedAt: Date.now() }
        : t
    ),
  }));

  return `Completed task: "${task.title}"`;
}

// Uncomplete a task
export function uncompleteTask(id: string): string {
  const state = loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  if (!task.completed) {
    return `Task "${task.title}" is not completed.`;
  }

  updateData(s => ({
    ...s,
    tasks: s.tasks.map(t =>
      t.id === id
        ? { ...t, completed: false, completedAt: undefined }
        : t
    ),
  }));

  return `Marked task as incomplete: "${task.title}"`;
}

// Delete a task
export function deleteTask(id: string): string {
  const state = loadData();
  const task = state.tasks.find(t => t.id === id);

  if (!task) {
    return `Task not found with ID: ${id}`;
  }

  updateData(s => ({
    ...s,
    tasks: s.tasks.filter(t => t.id !== id),
  }));

  return `Deleted task: "${task.title}"`;
}
