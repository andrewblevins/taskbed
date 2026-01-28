import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { v4 as uuid } from 'uuid';
import type { Task, Project, Area, AttributeDefinition, ViewGrouping, TaskStatus, ProjectStatus, SomedayItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_URL = 'http://localhost:3847/api/data';

// Current authenticated user ID - set by App on auth
let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

// Debounce helper for Supabase sync
let supabaseSyncTimeout: ReturnType<typeof setTimeout> | null = null;
const SUPABASE_SYNC_DEBOUNCE_MS = 1000;

// Sync state to Supabase (debounced)
const syncToSupabase = async (state: Record<string, unknown>): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase || !currentUserId) return;

  try {
    const { error } = await supabase
      .from('taskbed_state')
      .upsert(
        {
          user_id: currentUserId,
          state: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Supabase sync error:', error.message);
    } else {
      console.debug('Synced to Supabase');
    }
  } catch (err) {
    console.error('Supabase sync failed:', err);
  }
};

// Custom storage that syncs to localStorage, file API, AND Supabase
const fileBackedStorage = {
  getItem: (name: string): string | null => {
    // Primary: read from localStorage for fast startup
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    // Save to localStorage
    localStorage.setItem(name, value);

    // Sync to file via API (non-blocking) - for local MCP server
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: value,
    }).catch((err) => {
      // API might not be running, that's ok
      console.debug('File sync skipped (API not available):', err.message);
    });

    // Sync to Supabase (debounced, non-blocking)
    if (isSupabaseConfigured()) {
      if (supabaseSyncTimeout) {
        clearTimeout(supabaseSyncTimeout);
      }
      supabaseSyncTimeout = setTimeout(() => {
        try {
          const parsed = JSON.parse(value);
          if (parsed?.state) {
            syncToSupabase(parsed.state);
          }
        } catch {
          console.debug('Failed to parse state for Supabase sync');
        }
      }, SUPABASE_SYNC_DEBOUNCE_MS);
    }
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
  availableTags: string[]; // GTD contexts: @deep, @shallow, @calls, @out, @offline
  currentGrouping: ViewGrouping;
  selectedTagFilter: string | null; // filter tasks by context

  // Someday/Maybe items (separate from tasks)
  somedayItems: SomedayItem[];

  // Weekly Review state
  reviewInProgress: boolean;
  reviewStep: number;

  // Weekly Review actions
  startReview: () => void;
  resumeReview: () => void;
  nextReviewStep: () => void;
  prevReviewStep: () => void;
  exitReview: () => void;

  // Daily Review state
  dailyReviewInProgress: boolean;
  dailyReviewStep: number;
  dailyReviewProcessedCount: number;

  // Daily Review actions
  startDailyReview: () => void;
  nextDailyReviewStep: () => void;
  prevDailyReviewStep: () => void;
  exitDailyReview: () => void;
  incrementDailyReviewProcessed: () => void;

  // Morning Focus state (keeping for now, may remove later)
  dailyIntention: string;
  todayTaskIds: string[];
  todayDate: string;
  morningFocusStep: number;
  morningFocusInProgress: boolean;

  // Morning Focus actions
  startMorningFocus: () => void;
  nextMorningFocusStep: () => void;
  prevMorningFocusStep: () => void;
  exitMorningFocus: () => void;
  setDailyIntention: (intention: string) => void;
  toggleTodayTask: (taskId: string) => void;
  clearDailyData: () => void;
  completeMorningFocus: (intention: string, taskIds: string[]) => void;

  // Task actions
  addTask: (title: string, options?: {
    projectId?: string;
    areaId?: string;
    status?: TaskStatus;
    notes?: string;
    tags?: string[];
    dueDate?: number;
    attributes?: Record<string, string>;
    processed?: boolean;
  }) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  moveTaskToProject: (taskId: string, projectId: string | undefined, newIndex: number) => void;
  moveTaskToArea: (taskId: string, areaId: string | undefined, newIndex: number) => void;
  markTaskProcessed: (id: string) => void;

  // Status actions
  setTaskStatus: (id: string, status: TaskStatus) => void;
  moveToWaiting: (id: string, waitingFor: string) => void;
  activateTask: (id: string) => void;

  // Someday/Maybe actions
  addSomedayItem: (title: string, notes?: string) => string;
  updateSomedayItem: (id: string, updates: Partial<SomedayItem>) => void;
  deleteSomedayItem: (id: string) => void;
  convertSomedayToTask: (id: string, context: string) => string;
  convertSomedayToProject: (id: string, projectName: string, firstActionTitle: string, context: string) => void;

  // Project actions
  addProject: (name: string, areaId?: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  completeProject: (id: string) => void;
  cancelProject: (id: string) => void;
  reactivateProject: (id: string) => void;
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

  // Tag actions
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addTagToTask: (taskId: string, tag: string) => void;
  removeTagFromTask: (taskId: string, tag: string) => void;
  setTagFilter: (tag: string | null) => void;
  setTaskContext: (taskId: string, context: string) => void;

  // Due date actions
  setDueDate: (taskId: string, dueDate: number | undefined) => void;

  // Sync action
  syncFromFile: () => Promise<void>;

  // Migration action
  runMigrationV3: () => void;
}

export const useStore = create<TaskbedState>()(
  temporal(
    persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      areas: [],
      attributes: [],
      availableTags: ['@deep', '@shallow', '@calls', '@out', '@offline'],
      currentGrouping: { type: 'project' },
      selectedTagFilter: null,

      // Someday/Maybe items
      somedayItems: [],

      // Weekly Review state
      reviewInProgress: false,
      reviewStep: 0,

      startReview: () => set({ reviewInProgress: true, reviewStep: 0 }),
      resumeReview: () => set({ reviewInProgress: true }),
      nextReviewStep: () => set((state) => ({ reviewStep: state.reviewStep + 1 })),
      prevReviewStep: () => set((state) => ({ reviewStep: Math.max(0, state.reviewStep - 1) })),
      exitReview: () => set({ reviewInProgress: false }),

      // Daily Review state
      dailyReviewInProgress: false,
      dailyReviewStep: 0,
      dailyReviewProcessedCount: 0,

      startDailyReview: () => set({ dailyReviewInProgress: true, dailyReviewStep: 0, dailyReviewProcessedCount: 0 }),
      nextDailyReviewStep: () => set((state) => ({ dailyReviewStep: state.dailyReviewStep + 1 })),
      prevDailyReviewStep: () => set((state) => ({ dailyReviewStep: Math.max(0, state.dailyReviewStep - 1) })),
      exitDailyReview: () => set({ dailyReviewInProgress: false }),
      incrementDailyReviewProcessed: () => set((state) => ({ dailyReviewProcessedCount: state.dailyReviewProcessedCount + 1 })),

      // Morning Focus state
      dailyIntention: '',
      todayTaskIds: [],
      todayDate: '',
      morningFocusStep: 0,
      morningFocusInProgress: false,

      startMorningFocus: () => set({ morningFocusInProgress: true, morningFocusStep: 0 }),
      nextMorningFocusStep: () => set((state) => ({ morningFocusStep: state.morningFocusStep + 1 })),
      prevMorningFocusStep: () => set((state) => ({ morningFocusStep: Math.max(0, state.morningFocusStep - 1) })),
      exitMorningFocus: () => set({ morningFocusInProgress: false }),
      setDailyIntention: (intention) => set({ dailyIntention: intention }),
      toggleTodayTask: (taskId) =>
        set((state) => ({
          todayTaskIds: state.todayTaskIds.includes(taskId)
            ? state.todayTaskIds.filter((id) => id !== taskId)
            : [...state.todayTaskIds, taskId],
        })),
      clearDailyData: () => set({ dailyIntention: '', todayTaskIds: [], todayDate: '' }),
      completeMorningFocus: (intention, taskIds) =>
        set({
          dailyIntention: intention,
          todayTaskIds: taskIds,
          todayDate: new Date().toISOString().split('T')[0],
          morningFocusInProgress: false,
        }),

      addTask: (title, options = {}) => {
        const id = uuid();
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id,
              title,
              completed: false,
              status: options.status ?? 'active',
              projectId: options.projectId,
              areaId: options.areaId,
              notes: options.notes,
              tags: options.tags ?? [],
              dueDate: options.dueDate,
              attributes: options.attributes ?? {},
              processed: options.processed ?? false,
              createdAt: Date.now(),
            },
          ],
        }));
        return id;
      },

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

      moveTaskToArea: (taskId, areaId, newIndex) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const updatedTask = { ...task, areaId };
          const otherTasks = state.tasks.filter((t) => t.id !== taskId);

          const newTasks = [...otherTasks];
          newTasks.splice(newIndex, 0, updatedTask);

          return { tasks: newTasks };
        }),

      markTaskProcessed: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, processed: true } : t
          ),
        })),

      setTaskStatus: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  // Clear waiting fields if not waiting
                  waitingFor: status === 'waiting' ? t.waitingFor : undefined,
                  waitingSince: status === 'waiting' ? t.waitingSince : undefined,
                }
              : t
          ),
        })),

      moveToWaiting: (id, waitingFor) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'waiting' as const,
                  waitingFor,
                  waitingSince: Date.now(),
                  processed: true,
                }
              : t
          ),
        })),

      activateTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'active' as const,
                  waitingFor: undefined,
                  waitingSince: undefined,
                }
              : t
          ),
        })),

      // Someday/Maybe actions
      addSomedayItem: (title, notes) => {
        const id = uuid();
        set((state) => ({
          somedayItems: [
            ...state.somedayItems,
            { id, title, notes, createdAt: Date.now() },
          ],
        }));
        return id;
      },

      updateSomedayItem: (id, updates) =>
        set((state) => ({
          somedayItems: state.somedayItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      deleteSomedayItem: (id) =>
        set((state) => ({
          somedayItems: state.somedayItems.filter((item) => item.id !== id),
        })),

      convertSomedayToTask: (id, context) => {
        const state = get();
        const item = state.somedayItems.find((i) => i.id === id);
        if (!item) return '';

        const taskId = uuid();
        set((s) => ({
          somedayItems: s.somedayItems.filter((i) => i.id !== id),
          tasks: [
            ...s.tasks,
            {
              id: taskId,
              title: item.title,
              notes: item.notes,
              completed: false,
              status: 'active' as const,
              tags: [context],
              attributes: {},
              processed: true,
              createdAt: Date.now(),
            },
          ],
        }));
        return taskId;
      },

      convertSomedayToProject: (id, projectName, firstActionTitle, context) => {
        const state = get();
        const item = state.somedayItems.find((i) => i.id === id);
        if (!item) return;

        const projectId = uuid();
        const taskId = uuid();
        const maxOrder = Math.max(0, ...state.projects.map((p) => p.order ?? 0));

        set((s) => ({
          somedayItems: s.somedayItems.filter((i) => i.id !== id),
          projects: [
            ...s.projects,
            {
              id: projectId,
              name: projectName,
              order: maxOrder + 1,
              createdAt: Date.now(),
              status: 'active' as ProjectStatus,
            },
          ],
          tasks: [
            ...s.tasks,
            {
              id: taskId,
              title: firstActionTitle,
              completed: false,
              status: 'active' as const,
              projectId,
              tags: [context],
              attributes: {},
              processed: true,
              createdAt: Date.now(),
            },
          ],
        }));
      },

      addProject: (name, areaId) => {
        const id = uuid();
        set((state) => {
          const maxOrder = Math.max(0, ...state.projects.map((p) => p.order ?? 0));
          return {
            projects: [
              ...state.projects,
              { id, name, areaId, order: maxOrder + 1, createdAt: Date.now(), status: 'active' as ProjectStatus },
            ],
          };
        });
        return id;
      },

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

      completeProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: 'completed' as ProjectStatus, completedAt: Date.now() } : p
          ),
        })),

      cancelProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: 'cancelled' as ProjectStatus, completedAt: Date.now() } : p
          ),
        })),

      reactivateProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: 'active' as ProjectStatus, completedAt: undefined } : p
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
            const { [id]: _removed, ...rest } = t.attributes;
            void _removed; // Intentionally unused - we're removing this key
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

      addTag: (tag) =>
        set((state) => ({
          availableTags: state.availableTags.includes(tag)
            ? state.availableTags
            : [...state.availableTags, tag],
        })),

      removeTag: (tag) =>
        set((state) => ({
          availableTags: state.availableTags.filter((t) => t !== tag),
          tasks: state.tasks.map((task) => ({
            ...task,
            tags: (task.tags || []).filter((t) => t !== tag),
          })),
          selectedTagFilter: state.selectedTagFilter === tag ? null : state.selectedTagFilter,
        })),

      addTagToTask: (taskId, tag) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, tags: (task.tags || []).includes(tag) ? task.tags : [...(task.tags || []), tag] }
              : task
          ),
          // Auto-add tag to available tags if new
          availableTags: state.availableTags.includes(tag)
            ? state.availableTags
            : [...state.availableTags, tag],
        })),

      removeTagFromTask: (taskId, tag) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, tags: (task.tags || []).filter((t) => t !== tag) }
              : task
          ),
        })),

      setTagFilter: (tag) => set({ selectedTagFilter: tag }),

      setTaskContext: (taskId, context) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, tags: [context], processed: true }
              : task
          ),
        })),

      setDueDate: (taskId, dueDate) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, dueDate } : task
          ),
        })),

      syncFromFile: async () => {
        // Try Supabase first (for deployed/mobile access)
        if (isSupabaseConfigured() && supabase && currentUserId) {
          try {
            const { data, error } = await supabase
              .from('taskbed_state')
              .select('state, updated_at')
              .eq('user_id', currentUserId)
              .single();

            if (!error && data?.state) {
              console.debug('Synced from Supabase');
              set(data.state as Partial<TaskbedState>);
              return;
            }
          } catch (err) {
            console.debug('Supabase sync skipped:', err);
          }
        }

        // Fall back to local file API
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

      // Migration from v2 to v3: new contexts, someday items, remove energy
      runMigrationV3: () => {
        const state = get();

        // Keywords for context assignment
        const deepKeywords = ['write', 'draft', 'design', 'plan', 'think', 'research', 'read', 'review', 'analyze', 'create', 'build', 'implement', 'code', 'debug', 'develop', 'architect', 'document', 'prepare', 'compose', 'strategize'];
        const callsKeywords = ['call', 'phone', 'talk', 'discuss', 'meet', 'ask', 'interview', 'speak', 'chat', 'conversation'];
        const outKeywords = ['buy', 'pick up', 'drop off', 'return', 'errand', 'store', 'shop', 'deliver', 'mail', 'post office', 'bank', 'pharmacy', 'grocery', 'visit', 'appointment'];
        const shallowKeywords = ['email', 'reply', 'send', 'quick', 'update', 'check', 'confirm', 'schedule', 'order', 'submit', 'file', 'organize', 'book', 'register', 'pay', 'renew'];

        const assignContext = (title: string, notes?: string): string => {
          const text = `${title} ${notes || ''}`.toLowerCase();

          for (const kw of callsKeywords) {
            if (text.includes(kw)) return '@calls';
          }
          for (const kw of outKeywords) {
            if (text.includes(kw)) return '@out';
          }
          for (const kw of deepKeywords) {
            if (text.includes(kw)) return '@deep';
          }
          for (const kw of shallowKeywords) {
            if (text.includes(kw)) return '@shallow';
          }
          return '@shallow'; // default
        };

        // Migrate tasks
        const newSomedayItems: SomedayItem[] = [...state.somedayItems];
        const migratedTasks: Task[] = [];

        for (const task of state.tasks) {
          // Handle someday tasks - move to someday items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((task as any).status === 'someday') {
            newSomedayItems.push({
              id: task.id,
              title: task.title,
              notes: task.notes,
              createdAt: task.createdAt,
            });
            continue;
          }

          // Assign new context
          const context = assignContext(task.title, task.notes);

          migratedTasks.push({
            ...task,
            tags: [context],
            processed: true,
            attributes: {}, // clear energy attribute
          });
        }

        // Update state
        set({
          tasks: migratedTasks,
          somedayItems: newSomedayItems,
          availableTags: ['@deep', '@shallow', '@calls', '@out', '@offline'],
          attributes: [], // remove energy attribute
          currentGrouping: { type: 'project' },
        });

        // Mark migration as complete
        localStorage.setItem('gtd-contexts-migrated', 'true');
      },
    }),
    {
      name: 'taskbed-storage',
      storage: createJSONStorage(() => fileBackedStorage),
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as TaskbedState;
        if (version < 2) {
          // Migrate projects from completed boolean to status field
          state.projects = state.projects.map((p) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const oldProject = p as any;
            if (p.status === undefined) {
              return {
                ...p,
                status: oldProject.completed ? 'completed' : 'active',
              } as Project;
            }
            return p;
          });
        }
        if (version < 3) {
          // Initialize new fields for v3
          state.somedayItems = state.somedayItems || [];
          state.dailyReviewInProgress = false;
          state.dailyReviewStep = 0;
          state.dailyReviewProcessedCount = 0;
        }
        return state;
      },
    }
  ),
    {
      // Limit history to prevent memory bloat
      limit: 50,
      // Only track data changes, not UI state
      partialize: (state) => {
        const {
          reviewInProgress,
          reviewStep,
          currentGrouping,
          selectedTagFilter,
          morningFocusInProgress,
          morningFocusStep,
          dailyIntention,
          todayTaskIds,
          todayDate,
          dailyReviewInProgress,
          dailyReviewStep,
          dailyReviewProcessedCount,
          ...data
        } = state;
        void reviewInProgress;
        void reviewStep;
        void currentGrouping;
        void selectedTagFilter;
        void morningFocusInProgress;
        void morningFocusStep;
        void dailyIntention;
        void todayTaskIds;
        void todayDate;
        void dailyReviewInProgress;
        void dailyReviewStep;
        void dailyReviewProcessedCount;
        return data;
      },
    }
  )
);

// Export temporal store for undo/redo access
// zundo stores temporal state in useStore.temporal which is a vanilla zustand store
// We need to create a hook that uses useSyncExternalStore to make it reactive
import { useSyncExternalStore } from 'react';

type TemporalStoreState = {
  pastStates: Partial<TaskbedState>[];
  futureStates: Partial<TaskbedState>[];
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

export function useTemporalStore<T>(selector: (state: TemporalStoreState) => T): T {
  const temporalStore = useStore.temporal;
  return useSyncExternalStore(
    temporalStore.subscribe,
    () => selector(temporalStore.getState() as TemporalStoreState),
    () => selector(temporalStore.getState() as TemporalStoreState)
  );
}

// Real-time subscription for cross-device sync
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let realtimeSubscription: any = null;

export const subscribeToRealtimeUpdates = (): (() => void) => {
  if (!isSupabaseConfigured() || !supabase || !currentUserId) {
    return () => {}; // No-op cleanup
  }

  // Unsubscribe from any existing subscription
  if (realtimeSubscription) {
    supabase.removeChannel(realtimeSubscription);
  }

  realtimeSubscription = supabase
    .channel('taskbed-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'taskbed_state',
        filter: `user_id=eq.${currentUserId}`,
      },
      (payload) => {
        console.debug('Realtime update received:', payload);
        if (payload.new && (payload.new as { state?: unknown }).state) {
          const newState = (payload.new as { state: Partial<TaskbedState> }).state;
          // Only update if this wasn't our own change (check timestamp)
          useStore.setState(newState);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    if (realtimeSubscription && supabase) {
      supabase.removeChannel(realtimeSubscription);
      realtimeSubscription = null;
    }
  };
};
