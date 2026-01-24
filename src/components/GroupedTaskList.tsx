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
}

export function GroupedTaskList({ onSelectTask }: GroupedTaskListProps) {
  const {
    tasks,
    attributes,
    projects,
    currentGrouping,
    reorderTasks,
    moveTaskToAttributeGroup,
    moveTaskToProject,
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

  // Only show active tasks (not completed, not someday, not waiting)
  const incompleteTasks = tasks.filter((t) => !t.completed && (t.status === 'active' || !t.status));

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

      if ('attributeId' in currentGrouping) {
        // Moving to an attribute group
        const attr = attributes.find((a) => a.id === currentGrouping.attributeId);
        if (attr) {
          const targetTasks = incompleteTasks.filter((t) => {
            const value = t.attributes[attr.id];
            return groupId === 'unset' ? !value : value === groupId;
          });
          moveTaskToAttributeGroup(
            activeTaskId,
            currentGrouping.attributeId,
            groupId === 'unset' ? '' : groupId,
            targetTasks.length
          );
        }
      } else if ('type' in currentGrouping && currentGrouping.type === 'project') {
        // Moving to a project group
        const targetTasks = incompleteTasks.filter((t) => {
          return groupId === 'unset' ? !t.projectId : t.projectId === groupId;
        });
        moveTaskToProject(
          activeTaskId,
          groupId === 'unset' ? undefined : groupId,
          targetTasks.length
        );
      }
      return;
    }

    // Reordering within or across groups
    const activeTask = tasks.find((t) => t.id === activeTaskId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask || !overTask) return;

    // Determine if we're moving between groups
    if ('attributeId' in currentGrouping) {
      const attr = attributes.find((a) => a.id === currentGrouping.attributeId);
      if (attr) {
        const activeValue = activeTask.attributes[attr.id] || '';
        const overValue = overTask.attributes[attr.id] || '';

        if (activeValue !== overValue) {
          // Moving to a different attribute group
          const targetGroupTasks = incompleteTasks.filter(
            (t) => (t.attributes[attr.id] || '') === overValue
          );
          const overIndex = targetGroupTasks.findIndex((t) => t.id === overId);
          moveTaskToAttributeGroup(
            activeTaskId,
            attr.id,
            overValue,
            overIndex >= 0 ? overIndex : targetGroupTasks.length
          );
          return;
        }
      }
    } else if ('type' in currentGrouping && currentGrouping.type === 'project') {
      const activeProjectId = activeTask.projectId || '';
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
  if ('type' in currentGrouping && currentGrouping.type === 'project') {
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
                        <DraggableTask key={task.id} task={task} onSelect={onSelectTask} />
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
                    <DraggableTask key={task.id} task={task} onSelect={onSelectTask} />
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

  // Group by attribute
  if ('attributeId' in currentGrouping) {
    const attr = attributes.find((a) => a.id === currentGrouping.attributeId);
    if (!attr) return <div>Attribute not found</div>;

    const groups: Record<string, Task[]> = {};

    attr.options.forEach((opt) => {
      groups[opt.id] = [];
    });
    groups['unset'] = [];

    incompleteTasks.forEach((task) => {
      const value = task.attributes[attr.id];
      if (value && groups[value]) {
        groups[value].push(task);
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
            {attr.options.map((opt) => (
              <div key={opt.id} className="task-group">
                <h3
                  className="group-header droppable"
                  style={{ borderLeftColor: opt.color }}
                  data-group-id={opt.id}
                >
                  {opt.label}
                  <span className="group-count">{groups[opt.id].length}</span>
                </h3>
                <div className="group-tasks">
                  {groups[opt.id].map((task) => (
                    <DraggableTask key={task.id} task={task} onSelect={onSelectTask} />
                  ))}
                </div>
              </div>
            ))}
            {groups['unset'].length > 0 && (
              <div className="task-group">
                <h3 className="group-header unset droppable" data-group-id="unset">
                  Uncategorized
                  <span className="group-count">{groups['unset'].length}</span>
                </h3>
                <div className="group-tasks">
                  {groups['unset'].map((task) => (
                    <DraggableTask key={task.id} task={task} onSelect={onSelectTask} />
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

  // Flat list (no grouping)
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
            <DraggableTask key={task.id} task={task} onSelect={onSelectTask} />
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
