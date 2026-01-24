import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface DraggableTaskProps {
  task: Task;
  onSelect: (task: Task) => void;
  isFocused?: boolean;
}

export function DraggableTask({ task, onSelect, isFocused }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const className = [
    isDragging ? 'dragging' : '',
    isFocused ? 'keyboard-focused' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="task-item-wrapper">
        <button className="drag-handle" {...attributes} {...listeners}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="3" cy="2" r="1.5" />
            <circle cx="9" cy="2" r="1.5" />
            <circle cx="3" cy="6" r="1.5" />
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="3" cy="10" r="1.5" />
            <circle cx="9" cy="10" r="1.5" />
          </svg>
        </button>
        <TaskItem task={task} onSelect={onSelect} isFocused={isFocused} />
      </div>
    </div>
  );
}
