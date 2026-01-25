import { v4 as uuid } from 'uuid';
import { loadData, updateData } from '../data.js';
import type { Project } from '../types.js';

// List all projects
export async function listProjects(): Promise<string> {
  const state = await loadData();

  if (state.projects.length === 0) {
    return 'No projects found.';
  }

  const lines = state.projects.map(p => {
    const taskCount = state.tasks.filter(t => t.projectId === p.id && !t.completed).length;
    return `- ${p.name} (${taskCount} active tasks)${p.color ? ` [${p.color}]` : ''}`;
  });

  return `Found ${state.projects.length} project(s):\n\n${lines.join('\n')}`;
}

// Add a new project
export async function addProject(name: string, color?: string): Promise<string> {
  const state = await loadData();

  // Check for duplicate name
  if (state.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return `A project named "${name}" already exists.`;
  }

  const maxOrder = Math.max(0, ...state.projects.map(p => p.order ?? 0));

  const newProject: Project = {
    id: uuid(),
    name,
    color,
    order: maxOrder + 1,
    createdAt: Date.now(),
    status: 'active',
  };

  await updateData(s => ({
    ...s,
    projects: [...s.projects, newProject],
  }));

  return `Created project: "${name}" (ID: ${newProject.id})`;
}

// Delete a project
export async function deleteProject(id: string): Promise<string> {
  const state = await loadData();

  // Find project by ID or name
  const project = state.projects.find(
    p => p.id === id || p.name.toLowerCase() === id.toLowerCase()
  );

  if (!project) {
    return `Project not found: ${id}`;
  }

  // Count affected tasks
  const affectedTasks = state.tasks.filter(t => t.projectId === project.id).length;

  await updateData(s => ({
    ...s,
    projects: s.projects.filter(p => p.id !== project.id),
    // Remove project reference from tasks (move to no project)
    tasks: s.tasks.map(t =>
      t.projectId === project.id ? { ...t, projectId: undefined } : t
    ),
  }));

  let message = `Deleted project: "${project.name}"`;
  if (affectedTasks > 0) {
    message += ` (${affectedTasks} task(s) moved to no project)`;
  }
  return message;
}
