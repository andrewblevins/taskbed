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
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { useStore } from '../store';
import { DraggableTask } from './DraggableTask';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface GroupedTaskListProps {
  onSelectTask: (task: Task) => void;
  focusedTaskId?: string;
}

export function GroupedTaskList({ onSelectTask, focusedTaskId }: GroupedTaskListProps) {
  const {
    tasks,
    projects,
    areas,
    currentGrouping,
    reorderTasks,
    moveTaskToProject,
    moveTaskToArea,
    selectedTagFilter,
  } = useStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Only show active tasks (not completed, not waiting)
  // Also filter by context tag if a filter is selected
  const incompleteTasks = tasks.filter((t) => {
    if (t.completed || t.status !== 'active') return false;
    if (selectedTagFilter && !(t.tags || []).includes(selectedTagFilter)) return false;
    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a group header (droppable zone)
    if (overId.startsWith('group-')) {
      const groupId = overId.replace('group-', '');

      if (currentGrouping.type === 'project') {
        // Moving to a project group
        const targetTasks = incompleteTasks.filter((t) => {
          return groupId === 'unset' ? !t.projectId : t.projectId === groupId;
        });
        moveTaskToProject(
          activeTaskId,
          groupId === 'unset' ? undefined : groupId,
          targetTasks.length
        );
      } else if (currentGrouping.type === 'area') {
        // Moving to an area group
        const resolveAreaId = (t: Task) => t.areaId || (t.projectId ? projects.find(p => p.id === t.projectId)?.areaId : undefined);
        const targetTasks = incompleteTasks.filter((t) => {
          const taskAreaId = resolveAreaId(t);
          return groupId === 'unset' ? !taskAreaId : taskAreaId === groupId;
        });
        moveTaskToArea(
          activeTaskId,
          groupId === 'unset' ? undefined : groupId,
          targetTasks.length
        );
      }
      return;
    }

    // Reordering within or across groups
    const activeTaskObj = tasks.find((t) => t.id === activeTaskId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTaskObj || !overTask) return;

    // Determine if we're moving between groups
    if (currentGrouping.type === 'project') {
      const activeProjectId = activeTaskObj.projectId || '';
      const overProjectId = overTask.projectId || '';

      if (activeProjectId !== overProjectId) {
        // Moving to a different project
        const targetGroupTasks = incompleteTasks.filter(
          (t) => (t.projectId || '') === overProjectId
        );
        const overIndex = targetGroupTasks.findIndex((t) => t.id === overId);
        moveTaskToProject(
          activeTaskId,
          overTask.projectId,
          overIndex >= 0 ? overIndex : targetGroupTasks.length
        );
        return;
      }
    } else if (currentGrouping.type === 'area') {
      const resolveAreaId = (t: Task) => t.areaId || (t.projectId ? projects.find(p => p.id === t.projectId)?.areaId : undefined);
      const activeAreaId = resolveAreaId(activeTaskObj) || '';
      const overAreaId = resolveAreaId(overTask) || '';

      if (activeAreaId !== overAreaId) {
        const targetGroupTasks = incompleteTasks.filter(
          (t) => (resolveAreaId(t) || '') === overAreaId
        );
        const overIndex = targetGroupTasks.findIndex((t) => t.id === overId);
        moveTaskToArea(
          activeTaskId,
          overAreaId || undefined,
          overIndex >= 0 ? overIndex : targetGroupTasks.length
        );
        return;
      }
    }

    // Reordering within the same group - reorder the full task list
    const oldIndex = incompleteTasks.findIndex((t) => t.id === activeTaskId);
    const newIndex = incompleteTasks.findIndex((t) => t.id === overId);

    if (oldIndex !== newIndex) {
      const newOrder = [...incompleteTasks];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      reorderTasks(newOrder.map((t) => t.id));
    }
  };

  // Group by project
  if (currentGrouping.type === 'project') {
    const groups: Record<string, Task[]> = {};

    projects.forEach((p) => {
      groups[p.id] = [];
    });
    groups['unset'] = [];

    incompleteTasks.forEach((task) => {
      if (task.projectId && groups[task.projectId]) {
        groups[task.projectId].push(task);
      } else {
        groups['unset'].push(task);
      }
    });

    const allTaskIds = incompleteTasks.map((t) => t.id);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grouped-list">
          <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
            {projects.map(
              (project) =>
                groups[project.id].length > 0 && (
                  <div key={project.id} className="task-group">
                    <h3
                      className="group-header droppable"
                      style={{ borderLeftColor: project.color || '#6b7280' }}
                      data-group-id={project.id}
                    >
                      {project.name}
                      <span className="group-count">{groups[project.id].length}</span>
                    </h3>
                    <div className="group-tasks">
                      {groups[project.id].map((task) => (
                        <DraggableTask key={task.id} task={task} onSelect={onSelectTask} isFocused={focusedTaskId === task.id} />
                      ))}
                    </div>
                  </div>
                )
            )}
            {groups['unset'].length > 0 && (
              <div className="task-group">
                <h3 className="group-header unset droppable" data-group-id="unset">
                  No Project
                  <span className="group-count">{groups['unset'].length}</span>
                </h3>
                <div className="group-tasks">
                  {groups['unset'].map((task) => (
                    <DraggableTask key={task.id} task={task} onSelect={onSelectTask} isFocused={focusedTaskId === task.id} />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskItem task={activeTask} onSelect={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // Group by area
  if (currentGrouping.type === 'area') {
    const resolveAreaId = (t: Task) => t.areaId || (t.projectId ? projects.find(p => p.id === t.projectId)?.areaId : undefined);

    const groups: Record<string, Task[]> = {};
    areas.forEach((a) => {
      groups[a.id] = [];
    });
    groups['unset'] = [];

    incompleteTasks.forEach((task) => {
      const areaId = resolveAreaId(task);
      if (areaId && groups[areaId]) {
        groups[areaId].push(task);
      } else {
        groups['unset'].push(task);
      }
    });

    const allTaskIds = incompleteTasks.map((t) => t.id);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grouped-list">
          <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
            {areas.map(
              (area) =>
                groups[area.id].length > 0 && (
                  <div key={area.id} className="task-group">
                    <h3
                      className="group-header droppable"
                      data-group-id={area.id}
                    >
                      {area.name}
                      <span className="group-count">{groups[area.id].length}</span>
                    </h3>
                    <div className="group-tasks">
                      {groups[area.id].map((task) => (
                        <DraggableTask key={task.id} task={task} onSelect={onSelectTask} isFocused={focusedTaskId === task.id} />
                      ))}
                    </div>
                  </div>
                )
            )}
            {groups['unset'].length > 0 && (
              <div className="task-group">
                <h3 className="group-header unset droppable" data-group-id="unset">
                  No Area
                  <span className="group-count">{groups['unset'].length}</span>
                </h3>
                <div className="group-tasks">
                  {groups['unset'].map((task) => (
                    <DraggableTask key={task.id} task={task} onSelect={onSelectTask} isFocused={focusedTaskId === task.id} />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskItem task={activeTask} onSelect={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // Flat list (no grouping - type === 'none')
  const allTaskIds = incompleteTasks.map((t) => t.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-list">
        <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
          {incompleteTasks.map((task) => (
            <DraggableTask key={task.id} task={task} onSelect={onSelectTask} isFocused={focusedTaskId === task.id} />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="drag-overlay">
            <TaskItem task={activeTask} onSelect={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
