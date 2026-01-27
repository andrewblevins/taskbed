export type TaskStatus = 'active' | 'someday' | 'waiting';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  status: TaskStatus; // active = do now, someday = maybe later, waiting = blocked on someone
  projectId?: string;
  attributes: Record<string, string>; // flexible attributes like { energy: "high", context: "home" }
  tags: string[]; // GTD contexts like @phone, @errands, @computer
  createdAt: number;
  completedAt?: number;
  order?: number; // for sorting within groups
  // Waiting-specific fields
  waitingFor?: string; // what you're waiting on
  waitingSince?: number; // when it was moved to waiting
  // Area (optional - for organizing without a project)
  areaId?: string;
  // Due date (optional - GTD says only use for hard deadlines)
  dueDate?: number; // timestamp of the due date
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
  name: string; // e.g., "Energy", "Context"
  options: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  label: string; // e.g., "High", "Low", "Home", "Office"
  color?: string;
}

export type ViewGrouping = {
  attributeId: string; // which attribute to group by
} | {
  type: 'project';
} | {
  type: 'area';
} | {
  type: 'none';
};
