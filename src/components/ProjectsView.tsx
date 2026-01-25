import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { ProjectCompletionDialog } from './ProjectCompletionDialog';
import type { Project, Area } from '../types';

// Draggable Project Item
function DraggableProject({ project, onComplete }: { project: Project; onComplete: (project: Project) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const { updateProject, tasks } = useStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskCount = tasks.filter((t) => t.projectId === project.id && !t.completed).length;

  const handleSave = () => {
    if (name.trim() && name !== project.name) {
      updateProject(project.id, { name: name.trim() });
    } else {
      setName(project.name);
    }
    setIsEditing(false);
  };

  const handleCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(project);
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="pv-project editing">
        <input
          type="text"
          className="pv-project-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setName(project.name);
              setIsEditing(false);
            }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="pv-project">
      <button className="pv-drag-handle" {...attributes} {...listeners}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="2" r="1.5" />
          <circle cx="9" cy="2" r="1.5" />
          <circle cx="3" cy="6" r="1.5" />
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
        </svg>
      </button>
      <button className="pv-project-icon" onClick={handleCircleClick} title="Complete or cancel project">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7" />
        </svg>
      </button>
      <span className="pv-project-name" onClick={() => setIsEditing(true)}>
        {project.name}
      </span>
      <span className="pv-task-count">{taskCount}</span>
    </div>
  );
}

// Project item for drag overlay (non-interactive)
function ProjectOverlay({ project }: { project: Project }) {
  const { tasks } = useStore();
  const taskCount = tasks.filter((t) => t.projectId === project.id && !t.completed).length;

  return (
    <div className="pv-project drag-overlay-item">
      <div className="pv-project-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7" />
        </svg>
      </div>
      <span className="pv-project-name">{project.name}</span>
      <span className="pv-task-count">{taskCount}</span>
    </div>
  );
}

// Droppable Area container
function DroppableArea({ area, children }: { area: Area | null; children: React.ReactNode }) {
  const areaId = area?.id || 'no-area';
  const { setNodeRef, isOver } = useDroppable({
    id: `area-${areaId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`pv-area-drop-zone ${isOver ? 'drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

// Draggable Area header
function DraggableAreaHeader({ area }: { area: Area }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(area.name);
  const { updateArea, deleteArea, projects } = useStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `area-header-${area.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const projectCount = projects.filter((p) => p.areaId === area.id).length;

  const handleSave = () => {
    if (name.trim() && name !== area.name) {
      updateArea(area.id, { name: name.trim() });
    } else {
      setName(area.name);
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${area.name}" area? Projects will be moved to "No Area".`)) {
      deleteArea(area.id);
    }
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="pv-area-header editing">
        <input
          type="text"
          className="pv-area-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setName(area.name);
              setIsEditing(false);
            }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="pv-area-header">
      <button className="pv-drag-handle area-handle" {...attributes} {...listeners}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="2" r="1.5" />
          <circle cx="9" cy="2" r="1.5" />
          <circle cx="3" cy="6" r="1.5" />
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
        </svg>
      </button>
      <span className="pv-area-name" onClick={() => setIsEditing(true)}>
        {area.name}
      </span>
      <span className="pv-area-count">{projectCount} projects</span>
      <button className="pv-delete" onClick={handleDelete}>×</button>
    </div>
  );
}

export function ProjectsView() {
  const {
    projects,
    areas,
    addProject,
    addArea,
    reorderProjects,
    reorderAreas,
    moveProjectToArea,
  } = useStore();

  const [newProjectName, setNewProjectName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [completingProject, setCompletingProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort areas and projects by order, filtering out completed/cancelled projects
  const sortedAreas = [...areas].sort((a, b) => a.order - b.order);
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === undefined);
  const sortedProjects = [...activeProjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Group projects by area
  const projectsByArea: Record<string, Project[]> = { 'no-area': [] };
  sortedAreas.forEach((a) => {
    projectsByArea[a.id] = [];
  });
  sortedProjects.forEach((p) => {
    const key = p.areaId || 'no-area';
    if (!projectsByArea[key]) projectsByArea[key] = [];
    projectsByArea[key].push(p);
  });

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    if (!id.startsWith('area-header-')) {
      const project = projects.find((p) => p.id === id);
      if (project) setActiveProject(project);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle area reordering
    if (activeId.startsWith('area-header-') && overId.startsWith('area-header-')) {
      const activeAreaId = activeId.replace('area-header-', '');
      const overAreaId = overId.replace('area-header-', '');

      if (activeAreaId !== overAreaId) {
        const oldIndex = sortedAreas.findIndex((a) => a.id === activeAreaId);
        const newIndex = sortedAreas.findIndex((a) => a.id === overAreaId);

        const newOrder = [...sortedAreas];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        reorderAreas(newOrder.map((a) => a.id));
      }
      return;
    }

    // Handle project being dropped on an area drop zone
    if (overId.startsWith('area-')) {
      const targetAreaId = overId.replace('area-', '');
      const newAreaId = targetAreaId === 'no-area' ? undefined : targetAreaId;
      moveProjectToArea(activeId, newAreaId);
      return;
    }

    // Handle project reordering within the same or different area
    const activeProject = projects.find((p) => p.id === activeId);
    const overProject = projects.find((p) => p.id === overId);

    if (activeProject && overProject) {
      // If moving to different area, update areaId
      if (activeProject.areaId !== overProject.areaId) {
        moveProjectToArea(activeId, overProject.areaId);
      }

      // Reorder
      const oldIndex = sortedProjects.findIndex((p) => p.id === activeId);
      const newIndex = sortedProjects.findIndex((p) => p.id === overId);

      if (oldIndex !== newIndex) {
        const newOrder = [...sortedProjects];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        reorderProjects(newOrder.map((p) => p.id));
      }
    }
  };

  const handleAddProject = (areaId?: string) => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), areaId);
      setNewProjectName('');
    }
  };

  const handleAddArea = () => {
    if (newAreaName.trim()) {
      addArea(newAreaName.trim());
      setNewAreaName('');
    }
  };

  const allProjectIds = sortedProjects.map((p) => p.id);
  const allAreaHeaderIds = sortedAreas.map((a) => `area-header-${a.id}`);

  return (
    <>
      <header className="content-header">
        <h2>Projects & Areas</h2>
        <div className="pv-header-actions">
          <div className="pv-add-inline">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
              placeholder="New project..."
            />
            <button onClick={() => handleAddProject()}>+ Project</button>
          </div>
          <div className="pv-add-inline">
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
              placeholder="New area..."
            />
            <button onClick={handleAddArea}>+ Area</button>
          </div>
        </div>
      </header>

      <main className="content-body pv-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={[...allAreaHeaderIds, ...allProjectIds]}
            strategy={verticalListSortingStrategy}
          >
            {/* Areas with their projects */}
            {sortedAreas.map((area) => (
              <div key={area.id} className="pv-area">
                <DraggableAreaHeader area={area} />
                <DroppableArea area={area}>
                  <div className="pv-projects-list">
                    {projectsByArea[area.id]?.map((project) => (
                      <DraggableProject key={project.id} project={project} onComplete={setCompletingProject} />
                    ))}
                    {projectsByArea[area.id]?.length === 0 && (
                      <div className="pv-empty">Drop projects here</div>
                    )}
                  </div>
                </DroppableArea>
              </div>
            ))}

            {/* Projects without an area */}
            {projectsByArea['no-area']?.length > 0 && (
              <div className="pv-area no-area">
                <div className="pv-area-header static">
                  <span className="pv-area-name">No Area</span>
                  <span className="pv-area-count">{projectsByArea['no-area'].length} projects</span>
                </div>
                <DroppableArea area={null}>
                  <div className="pv-projects-list">
                    {projectsByArea['no-area'].map((project) => (
                      <DraggableProject key={project.id} project={project} onComplete={setCompletingProject} />
                    ))}
                  </div>
                </DroppableArea>
              </div>
            )}

            {/* Empty state when no projects or areas */}
            {projects.length === 0 && areas.length === 0 && (
              <div className="pv-empty-state">
                <div className="pv-empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="12" y="12" width="40" height="40" rx="8" />
                    <path d="M12 24h40" />
                    <path d="M24 24v28" />
                  </svg>
                </div>
                <h3>No projects yet</h3>
                <p>Create areas to organize your projects, or add projects directly using the inputs above.</p>
              </div>
            )}
          </SortableContext>

          <DragOverlay>
            {activeProject ? <ProjectOverlay project={activeProject} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {completingProject && (
        <ProjectCompletionDialog
          project={completingProject}
          onClose={() => setCompletingProject(null)}
        />
      )}
    </>
  );
}
