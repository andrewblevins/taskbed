import { useStore } from '../store';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onSelect: (task: Task) => void;
}

export function TaskItem({ task, onSelect }: TaskItemProps) {
  const { toggleTask, projects } = useStore();
  const project = projects.find((p) => p.id === task.projectId);

  return (
    <div className="task-item" onClick={() => onSelect(task)}>
      <button
        className={`task-checkbox ${task.completed ? 'completed' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTask(task.id);
        }}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <span>✓</span>}
      </button>
      <div className="task-content">
        <span className={`task-title ${task.completed ? 'completed' : ''}`}>
          {task.title}
        </span>
        {project && <span className="task-project">{project.name}</span>}
      </div>
    </div>
  );
}
