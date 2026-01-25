import { useMemo } from 'react';
import { useStore } from '../store';
import type { Task, Project } from '../types';

interface CompletedViewProps {
  onSelectTask: (task: Task) => void;
}

type DatePeriod = 'today' | 'yesterday' | 'thisWeek' | 'older';

function getDatePeriod(timestamp: number | undefined): DatePeriod {
  if (!timestamp) return 'older';
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - taskDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'thisWeek';
  return 'older';
}

function formatCompletedDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const periodLabels: Record<DatePeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  older: 'Older',
};

const periodOrder: DatePeriod[] = ['today', 'yesterday', 'thisWeek', 'older'];

export function CompletedView({ onSelectTask }: CompletedViewProps) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const updateTask = useStore((s) => s.updateTask);
  const reactivateProject = useStore((s) => s.reactivateProject);

  const completedTasks = useMemo(() =>
    tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)),
    [tasks]
  );

  const completedProjects = useMemo(() =>
    projects
      .filter((p) => p.status === 'completed' || p.status === 'cancelled')
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)),
    [projects]
  );

  // Group tasks by date period
  const tasksByPeriod = useMemo(() => {
    const groups: Record<DatePeriod, Task[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    completedTasks.forEach((task) => {
      const period = getDatePeriod(task.completedAt);
      groups[period].push(task);
    });
    return groups;
  }, [completedTasks]);

  const restoreTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    updateTask(taskId, { completed: false, completedAt: undefined });
  };

  const restoreProject = (projectId: string) => {
    reactivateProject(projectId);
  };

  return (
    <>
      <header className="content-header">
        <h2>Completed</h2>
        <span className="header-count">
          {completedTasks.length} tasks, {completedProjects.length} projects
        </span>
      </header>
      <main className="content-body">
        {completedTasks.length === 0 && completedProjects.length === 0 ? (
          <div className="empty-state">
            <p>No completed items yet. Completed tasks and projects will appear here.</p>
          </div>
        ) : (
          <>
            {/* Completed Projects Section */}
            {completedProjects.length > 0 && (
              <section className="completed-section">
                <h3 className="completed-section-header">Projects</h3>
                <div className="completed-list">
                  {completedProjects.map((project) => (
                    <CompletedProjectItem
                      key={project.id}
                      project={project}
                      onRestore={() => restoreProject(project.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Tasks Section - Grouped by Date Period */}
            {completedTasks.length > 0 && (
              <section className="completed-section">
                <h3 className="completed-section-header">Tasks</h3>
                {periodOrder.map((period) => {
                  const periodTasks = tasksByPeriod[period];
                  if (periodTasks.length === 0) return null;
                  return (
                    <div key={period} className="completed-period-group">
                      <h4 className="completed-period-header">{periodLabels[period]}</h4>
                      <div className="completed-list">
                        {periodTasks.map((task) => (
                          <CompletedTaskItem
                            key={task.id}
                            task={task}
                            onSelect={() => onSelectTask(task)}
                            onRestore={(e) => restoreTask(e, task.id)}
                            showDate={period === 'thisWeek' || period === 'older'}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function CompletedProjectItem({
  project,
  onRestore,
}: {
  project: Project;
  onRestore: () => void;
}) {
  return (
    <div className="completed-item">
      <div className="completed-item-main">
        <span className={`project-status-badge status-${project.status}`}>
          {project.status === 'completed' ? 'Completed' : 'Cancelled'}
        </span>
        <span className="completed-item-name">{project.name}</span>
      </div>
      <div className="completed-item-actions">
        <span className="completed-date">{formatCompletedDate(project.completedAt)}</span>
        <button className="restore-btn" onClick={onRestore}>
          Restore
        </button>
      </div>
    </div>
  );
}

function CompletedTaskItem({
  task,
  onSelect,
  onRestore,
  showDate = true,
}: {
  task: Task;
  onSelect: () => void;
  onRestore: (e: React.MouseEvent) => void;
  showDate?: boolean;
}) {
  const projects = useStore((s) => s.projects);
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;

  return (
    <div className="completed-item clickable" onClick={onSelect}>
      <div className="completed-item-main">
        <span className="completed-item-name">{task.title}</span>
        {project && <span className="completed-item-project">{project.name}</span>}
      </div>
      <div className="completed-item-actions">
        {showDate && <span className="completed-date">{formatCompletedDate(task.completedAt)}</span>}
        <button className="restore-btn" onClick={onRestore}>
          Restore
        </button>
      </div>
    </div>
  );
}
