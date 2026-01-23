export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  projectId?: string;
  attributes: Record<string, string>; // flexible attributes like { energy: "high", context: "home" }
  createdAt: number;
  completedAt?: number;
  order?: number; // for sorting within groups
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
  areaId?: string; // optional - projects can be in an area or standalone
  order: number;
  createdAt: number;
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
  type: 'none';
};
