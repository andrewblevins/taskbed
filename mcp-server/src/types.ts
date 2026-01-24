// Types for Taskbed - kept in sync with main app's src/types/index.ts

export type TaskStatus = 'active' | 'someday' | 'waiting';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  status: TaskStatus;
  projectId?: string;
  attributes: Record<string, string>;
  tags: string[];
  createdAt: number;
  completedAt?: number;
  order?: number;
  waitingFor?: string;
  waitingSince?: number;
  dueDate?: number;
}

export interface Area {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
  areaId?: string;
  order?: number;
  createdAt: number;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  options: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  label: string;
  color?: string;
}

// The full state shape as stored in taskbed.json
export interface TaskbedState {
  tasks: Task[];
  projects: Project[];
  areas: Area[];
  attributes: AttributeDefinition[];
  availableTags: string[];
  currentGrouping: unknown;
  selectedTagFilter: string | null;
  reviewInProgress: boolean;
  reviewStep: number;
}

// Default state for new/empty data file
export const defaultState: TaskbedState = {
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
  availableTags: ['@phone', '@computer', '@errands', '@home', '@office', '@anywhere'],
  currentGrouping: { attributeId: 'energy' },
  selectedTagFilter: null,
  reviewInProgress: false,
  reviewStep: 0,
};
