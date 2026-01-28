export type TaskStatus = 'active' | 'waiting';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  status: TaskStatus; // active = next action, waiting = blocked on something
  projectId?: string;
  attributes: Record<string, string>; // flexible attributes
  tags: string[]; // GTD contexts like @deep, @shallow, @calls, @out, @offline
  createdAt: number;
  completedAt?: number;
  order?: number; // for sorting within groups
  processed?: boolean; // true = has been clarified in inbox processing
  // Waiting-specific fields
  waitingFor?: string; // what you're waiting on
  waitingSince?: number; // when it was moved to waiting
  // Area (optional - for organizing without a project)
  areaId?: string;
  // Due date (optional - GTD says only use for hard deadlines)
  dueDate?: number; // timestamp of the due date
}

// Someday/Maybe items - separate from tasks, not committed to yet
export interface SomedayItem {
  id: string;
  title: string;
  notes?: string;
  createdAt: number;
}

export interface Area {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export type ProjectStatus = 'active' | 'someday' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  color?: string;
  areaId?: string; // optional - projects can be in an area or standalone
  order: number;
  createdAt: number;
  status: ProjectStatus;
  completedAt?: number; // timestamp when completed or cancelled
}

export interface AttributeDefinition {
  id: string;
  name: string; // e.g., "Context"
  options: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  label: string; // e.g., "High", "Low", "Home", "Office"
  color?: string;
}

export type ViewGrouping = {
  type: 'project';
} | {
  type: 'area';
} | {
  type: 'none';
};
