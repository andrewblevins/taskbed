import { useStore } from '../store';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface GroupedTaskListProps {
  onSelectTask: (task: Task) => void;
}

export function GroupedTaskList({ onSelectTask }: GroupedTaskListProps) {
  const { tasks, attributes, currentGrouping } = useStore();

  const incompleteTasks = tasks.filter((t) => !t.completed);

  // Group by attribute
  if ('attributeId' in currentGrouping) {
    const attr = attributes.find((a) => a.id === currentGrouping.attributeId);
    if (!attr) return <div>Attribute not found</div>;

    const groups: Record<string, typeof tasks> = {};

    // Initialize groups for each option
    attr.options.forEach((opt) => {
      groups[opt.id] = [];
    });
    groups['unset'] = [];

    // Sort tasks into groups
    incompleteTasks.forEach((task) => {
      const value = task.attributes[attr.id];
      if (value && groups[value]) {
        groups[value].push(task);
      } else {
        groups['unset'].push(task);
      }
    });

    return (
      <div className="grouped-list">
        {attr.options.map((opt) => (
          <div key={opt.id} className="task-group">
            <h3 className="group-header" style={{ borderLeftColor: opt.color }}>
              {opt.label}
              <span className="group-count">{groups[opt.id].length}</span>
            </h3>
            <div className="group-tasks">
              {groups[opt.id].map((task) => (
                <TaskItem key={task.id} task={task} onSelect={onSelectTask} />
              ))}
            </div>
          </div>
        ))}
        {groups['unset'].length > 0 && (
          <div className="task-group">
            <h3 className="group-header unset">
              Uncategorized
              <span className="group-count">{groups['unset'].length}</span>
            </h3>
            <div className="group-tasks">
              {groups['unset'].map((task) => (
                <TaskItem key={task.id} task={task} onSelect={onSelectTask} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Flat list (no grouping)
  return (
    <div className="task-list">
      {incompleteTasks.map((task) => (
        <TaskItem key={task.id} task={task} onSelect={onSelectTask} />
      ))}
    </div>
  );
}
