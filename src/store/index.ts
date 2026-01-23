import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Task, Project, AttributeDefinition, ViewGrouping } from '../types';

interface TaskbedState {
  tasks: Task[];
  projects: Project[];
  attributes: AttributeDefinition[];
  currentGrouping: ViewGrouping;

  // Task actions
  addTask: (title: string, projectId?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Project actions
  addProject: (name: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Attribute actions
  addAttribute: (name: string) => void;
  updateAttribute: (id: string, updates: Partial<AttributeDefinition>) => void;
  deleteAttribute: (id: string) => void;
  addAttributeOption: (attributeId: string, label: string) => void;

  // View actions
  setGrouping: (grouping: ViewGrouping) => void;
}

export const useStore = create<TaskbedState>()(
  persist(
    (set) => ({
      tasks: [],
      projects: [],
      attributes: [
        {
          id: 'energy',
          name: 'Energy',
          options: [
            { id: 'high', label: 'High', color: '#ef4444' },
            { id: 'medium', label: 'Medium', color: '#f59e0b' },
            { id: 'low', label: 'Low', color: '#22c55e' },
          ],
        },
      ],
      currentGrouping: { attributeId: 'energy' },

      addTask: (title, projectId) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: uuid(),
              title,
              completed: false,
              projectId,
              attributes: {},
              createdAt: Date.now(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? Date.now() : undefined,
                }
              : t
          ),
        })),

      addProject: (name) =>
        set((state) => ({
          projects: [
            ...state.projects,
            { id: uuid(), name, createdAt: Date.now() },
          ],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: undefined } : t
          ),
        })),

      addAttribute: (name) =>
        set((state) => ({
          attributes: [
            ...state.attributes,
            { id: uuid(), name, options: [] },
          ],
        })),

      updateAttribute: (id, updates) =>
        set((state) => ({
          attributes: state.attributes.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteAttribute: (id) =>
        set((state) => ({
          attributes: state.attributes.filter((a) => a.id !== id),
          tasks: state.tasks.map((t) => {
            const { [id]: _, ...rest } = t.attributes;
            return { ...t, attributes: rest };
          }),
        })),

      addAttributeOption: (attributeId, label) =>
        set((state) => ({
          attributes: state.attributes.map((a) =>
            a.id === attributeId
              ? { ...a, options: [...a.options, { id: uuid(), label }] }
              : a
          ),
        })),

      setGrouping: (grouping) => set({ currentGrouping: grouping }),
    }),
    {
      name: 'taskbed-storage',
    }
  )
);
