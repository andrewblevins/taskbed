import { useStore } from '../store';
import type { Task, Project } from '../types';

interface CompletedViewProps {
  onSelectTask: (task: Task) => void;
}

function formatCompletedDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CompletedView({ onSelectTask }: CompletedViewProps) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const updateTask = useStore((s) => s.updateTask);
  const reactivateProject = useStore((s) => s.reactivateProject);

  const completedTasks = tasks
    .filter((t) => t.completed)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const completedProjects = projects
    .filter((p) => p.status === 'completed' || p.status === 'cancelled')
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

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

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <section className="completed-section">
                <h3 className="completed-section-header">Tasks</h3>
                <div className="completed-list">
                  {completedTasks.map((task) => (
                    <CompletedTaskItem
                      key={task.id}
                      task={task}
                      onSelect={() => onSelectTask(task)}
                      onRestore={(e) => restoreTask(e, task.id)}
                    />
                  ))}
                </div>
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
}: {
  task: Task;
  onSelect: () => void;
  onRestore: (e: React.MouseEvent) => void;
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
        <span className="completed-date">{formatCompletedDate(task.completedAt)}</span>
        <button className="restore-btn" onClick={onRestore}>
          Restore
        </button>
      </div>
    </div>
  );
}
