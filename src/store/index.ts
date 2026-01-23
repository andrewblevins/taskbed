import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Task, Project, Area, AttributeDefinition, ViewGrouping } from '../types';

const API_URL = 'http://localhost:3847/api/data';

// Custom storage that syncs to both localStorage AND a file via API
const fileBackedStorage = {
  getItem: (name: string): string | null => {
    // Primary: read from localStorage for fast startup
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    // Save to localStorage
    localStorage.setItem(name, value);

    // Also sync to file via API (non-blocking)
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: value,
    }).catch((err) => {
      // API might not be running, that's ok
      console.debug('File sync skipped (API not available):', err.message);
    });
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

interface TaskbedState {
  tasks: Task[];
  projects: Project[];
  areas: Area[];
  attributes: AttributeDefinition[];
  currentGrouping: ViewGrouping;

  // Review state
  reviewInProgress: boolean;
  reviewStep: number;

  // Review actions
  startReview: () => void;
  nextReviewStep: () => void;
  prevReviewStep: () => void;
  exitReview: () => void;

  // Task actions
  addTask: (title: string, projectId?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  moveTaskToAttributeGroup: (taskId: string, attributeId: string, value: string, newIndex: number) => void;
  moveTaskToProject: (taskId: string, projectId: string | undefined, newIndex: number) => void;

  // Project actions
  addProject: (name: string, areaId?: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (projectIds: string[]) => void;
  moveProjectToArea: (projectId: string, areaId: string | undefined) => void;

  // Area actions
  addArea: (name: string) => void;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (id: string) => void;
  reorderAreas: (areaIds: string[]) => void;

  // Attribute actions
  addAttribute: (name: string) => void;
  updateAttribute: (id: string, updates: Partial<AttributeDefinition>) => void;
  deleteAttribute: (id: string) => void;
  addAttributeOption: (attributeId: string, label: string) => void;

  // View actions
  setGrouping: (grouping: ViewGrouping) => void;

  // Sync action
  syncFromFile: () => Promise<void>;
}

export const useStore = create<TaskbedState>()(
  persist(
    (set) => ({
      tasks: [],
      projects: [],
      areas: [],
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

      // Review state
      reviewInProgress: false,
      reviewStep: 0,

      startReview: () => set({ reviewInProgress: true, reviewStep: 0 }),
      nextReviewStep: () => set((state) => ({ reviewStep: state.reviewStep + 1 })),
      prevReviewStep: () => set((state) => ({ reviewStep: Math.max(0, state.reviewStep - 1) })),
      exitReview: () => set({ reviewInProgress: false, reviewStep: 0 }),

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

      reorderTasks: (taskIds) =>
        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          const reorderedTasks = taskIds
            .map((id) => taskMap.get(id))
            .filter((t): t is Task => t !== undefined);
          const otherTasks = state.tasks.filter((t) => !taskIds.includes(t.id));
          return { tasks: [...reorderedTasks, ...otherTasks] };
        }),

      moveTaskToAttributeGroup: (taskId, attributeId, value, newIndex) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const newAttributes = { ...task.attributes };
          if (value) {
            newAttributes[attributeId] = value;
          } else {
            delete newAttributes[attributeId];
          }

          const updatedTask = { ...task, attributes: newAttributes };
          const otherTasks = state.tasks.filter((t) => t.id !== taskId);

          // Insert at new position
          const newTasks = [...otherTasks];
          newTasks.splice(newIndex, 0, updatedTask);

          return { tasks: newTasks };
        }),

      moveTaskToProject: (taskId, projectId, newIndex) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const updatedTask = { ...task, projectId };
          const otherTasks = state.tasks.filter((t) => t.id !== taskId);

          // Insert at new position
          const newTasks = [...otherTasks];
          newTasks.splice(newIndex, 0, updatedTask);

          return { tasks: newTasks };
        }),

      addProject: (name, areaId) =>
        set((state) => {
          const maxOrder = Math.max(0, ...state.projects.map((p) => p.order ?? 0));
          return {
            projects: [
              ...state.projects,
              { id: uuid(), name, areaId, order: maxOrder + 1, createdAt: Date.now() },
            ],
          };
        }),

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

      reorderProjects: (projectIds) =>
        set((state) => {
          const updatedProjects = state.projects.map((p) => {
            const newOrder = projectIds.indexOf(p.id);
            return newOrder >= 0 ? { ...p, order: newOrder } : p;
          });
          return { projects: updatedProjects };
        }),

      moveProjectToArea: (projectId, areaId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, areaId } : p
          ),
        })),

      addArea: (name) =>
        set((state) => {
          const maxOrder = Math.max(0, ...state.areas.map((a) => a.order));
          return {
            areas: [
              ...state.areas,
              { id: uuid(), name, order: maxOrder + 1, createdAt: Date.now() },
            ],
          };
        }),

      updateArea: (id, updates) =>
        set((state) => ({
          areas: state.areas.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteArea: (id) =>
        set((state) => ({
          areas: state.areas.filter((a) => a.id !== id),
          // Move projects from deleted area to no area
          projects: state.projects.map((p) =>
            p.areaId === id ? { ...p, areaId: undefined } : p
          ),
        })),

      reorderAreas: (areaIds) =>
        set((state) => {
          const updatedAreas = state.areas.map((a) => {
            const newOrder = areaIds.indexOf(a.id);
            return newOrder >= 0 ? { ...a, order: newOrder } : a;
          });
          return { areas: updatedAreas };
        }),

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

      syncFromFile: async () => {
        try {
          const response = await fetch(API_URL);
          if (response.ok) {
            const data = await response.json();
            if (data?.state) {
              set(data.state);
            }
          }
        } catch (err) {
          console.debug('File sync skipped:', err);
        }
      },
    }),
    {
      name: 'taskbed-storage',
      storage: createJSONStorage(() => fileBackedStorage),
    }
  )
);
