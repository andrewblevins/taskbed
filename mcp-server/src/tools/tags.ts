import { loadData, updateData } from '../data.js';

// List available context tags
export function listTags(): string {
  const state = loadData();

  if (state.availableTags.length === 0) {
    return 'No context tags defined.';
  }

  // Count tasks for each tag
  const tagCounts = new Map<string, number>();
  for (const task of state.tasks) {
    if (!task.completed && task.status === 'active') {
      for (const tag of task.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  const lines = state.availableTags.map(tag => {
    const count = tagCounts.get(tag) || 0;
    return `- ${tag} (${count} active tasks)`;
  });

  return `Available context tags:\n\n${lines.join('\n')}`;
}

// Add a new context tag
export function addTag(tag: string): string {
  // Normalize: ensure starts with @
  const normalizedTag = tag.startsWith('@') ? tag : `@${tag}`;

  const state = loadData();

  if (state.availableTags.includes(normalizedTag)) {
    return `Tag "${normalizedTag}" already exists.`;
  }

  updateData(s => ({
    ...s,
    availableTags: [...s.availableTags, normalizedTag],
  }));

  return `Added context tag: ${normalizedTag}`;
}
