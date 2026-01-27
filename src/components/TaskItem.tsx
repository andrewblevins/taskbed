import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import type { Task } from '../types';

// Helper to format due date
function formatDueDate(dueDate: number): { text: string; isOverdue: boolean; isDueSoon: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`, isOverdue: true, isDueSoon: false };
  }
  if (diffDays === 0) return { text: 'Today', isOverdue: false, isDueSoon: true };
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isDueSoon: true };
  if (diffDays <= 7) return { text: `In ${diffDays} days`, isOverdue: false, isDueSoon: true };
  return { text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: false, isDueSoon: false };
}

interface TaskItemProps {
  task: Task;
  onSelect: (task: Task) => void;
  isFocused?: boolean;
}

export function TaskItem({ task, onSelect, isFocused }: TaskItemProps) {
  const { toggleTask, deleteTask, projects } = useStore();
  const project = projects.find((p) => p.id === task.projectId);
  const itemRef = useRef<HTMLDivElement>(null);

  const dueDateInfo = useMemo(() => {
    if (!task.dueDate) return null;
    return formatDueDate(task.dueDate);
  }, [task.dueDate]);

  // Scroll into view when focused via keyboard
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  return (
    <div
      ref={itemRef}
      className={`task-item${isFocused ? ' focused' : ''}`}
      onClick={() => onSelect(task)}
    >
      <button
        className={`task-checkbox ${task.completed ? 'completed' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTask(task.id);
        }}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" className="checkbox-circle" />
          {task.completed && (
            <path d="M5.5 9.5L8 12L12.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="checkbox-check" />
          )}
        </svg>
      </button>
      <div className="task-content">
        <span className={`task-title ${task.completed ? 'completed' : ''}`}>
          {task.title}
        </span>
        <div className="task-meta">
          {project && <span className="task-project">{project.name}</span>}
          {dueDateInfo && (
            <span className={`task-due-date ${dueDateInfo.isOverdue ? 'overdue' : ''} ${dueDateInfo.isDueSoon ? 'due-soon' : ''}`}>
              {dueDateInfo.text}
            </span>
          )}
          {task.tags && task.tags.length > 0 && (
            <span className="task-tags-inline">
              {task.tags.map((tag) => (
                <span key={tag} className="task-tag-inline">{tag}</span>
              ))}
            </span>
          )}
        </div>
      </div>
      <button
        className="task-delete"
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task.id);
        }}
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  );
}
