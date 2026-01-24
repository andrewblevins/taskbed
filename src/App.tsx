import { useState, useEffect } from 'react';
import { TaskInput } from './components/TaskInput';
import { GroupedTaskList } from './components/GroupedTaskList';
import { GroupingSelector } from './components/GroupingSelector';
import { TaskDetail } from './components/TaskDetail';
import { ProjectsView } from './components/ProjectsView';
import { AttributeManager } from './components/AttributeManager';
import { WeeklyReview } from './components/WeeklyReview';
import { useStore } from './store';
import type { Task } from './types';
import './App.css';

type View = 'tasks' | 'projects' | 'someday' | 'waiting';

// Count badges for sidebar
function SomedayCount() {
  const tasks = useStore((s) => s.tasks);
  const count = tasks.filter((t) => !t.completed && (t.status === 'someday')).length;
  if (count === 0) return null;
  return <span className="nav-count">{count}</span>;
}

function WaitingCount() {
  const tasks = useStore((s) => s.tasks);
  const count = tasks.filter((t) => !t.completed && (t.status === 'waiting')).length;
  if (count === 0) return null;
  return <span className="nav-count">{count}</span>;
}

// Helper to format "waiting since" duration
function formatWaitingDuration(since: number): string {
  const days = Math.floor((Date.now() - since) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// Someday View
function SomedayView({ onSelectTask }: { onSelectTask: (task: Task) => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const activateTask = useStore((s) => s.activateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const somedayTasks = tasks.filter((t) => !t.completed && t.status === 'someday');
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <>
      <header className="content-header">
        <h2>Someday / Maybe</h2>
        <span className="header-count">{somedayTasks.length} items</span>
      </header>
      <main className="content-body">
        {somedayTasks.length === 0 ? (
          <div className="empty-state">
            <p>No someday items. Ideas you're not ready to commit to will appear here.</p>
          </div>
        ) : (
          <div className="status-task-list">
            {somedayTasks.map((task) => (
              <div key={task.id} className="status-task-item" onClick={() => onSelectTask(task)}>
                <div className="status-task-content">
                  <span className="status-task-title">{task.title}</span>
                  {task.projectId && (
                    <span className="status-task-project">
                      {projectMap.get(task.projectId)?.name}
                    </span>
                  )}
                </div>
                <div className="status-task-actions">
                  <button
                    className="status-action-btn activate"
                    onClick={(e) => { e.stopPropagation(); activateTask(task.id); }}
                    title="Move to Active"
                  >
                    Activate
                  </button>
                  <button
                    className="status-action-btn delete"
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// Waiting For View
function WaitingView({ onSelectTask }: { onSelectTask: (task: Task) => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const activateTask = useStore((s) => s.activateTask);
  const toggleTask = useStore((s) => s.toggleTask);

  const waitingTasks = tasks.filter((t) => !t.completed && t.status === 'waiting');
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Sort by waiting duration (oldest first)
  const sortedTasks = [...waitingTasks].sort((a, b) =>
    (a.waitingSince || 0) - (b.waitingSince || 0)
  );

  return (
    <>
      <header className="content-header">
        <h2>Waiting For</h2>
        <span className="header-count">{waitingTasks.length} items</span>
      </header>
      <main className="content-body">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>Nothing pending from others. Tasks you're waiting on will appear here.</p>
          </div>
        ) : (
          <div className="status-task-list">
            {sortedTasks.map((task) => {
              const waitingDays = task.waitingSince
                ? Math.floor((Date.now() - task.waitingSince) / (1000 * 60 * 60 * 24))
                : 0;
              const isOverdue = waitingDays > 7;

              return (
                <div key={task.id} className="status-task-item waiting-item" onClick={() => onSelectTask(task)}>
                  <div className="status-task-content">
                    <div className="waiting-header">
                      <span className="waiting-for-label">
                        Waiting for <strong>{task.waitingFor || 'someone'}</strong>
                      </span>
                      <span className={`waiting-duration ${isOverdue ? 'overdue' : ''}`}>
                        {task.waitingSince ? formatWaitingDuration(task.waitingSince) : ''}
                      </span>
                    </div>
                    <span className="status-task-title">{task.title}</span>
                    {task.projectId && (
                      <span className="status-task-project">
                        {projectMap.get(task.projectId)?.name}
                      </span>
                    )}
                  </div>
                  <div className="status-task-actions">
                    <button
                      className="status-action-btn complete"
                      onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                      title="Received / Done"
                    >
                      Done
                    </button>
                    <button
                      className="status-action-btn activate"
                      onClick={(e) => { e.stopPropagation(); activateTask(task.id); }}
                      title="Follow up (move to Active)"
                    >
                      Follow up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<View>('tasks');
  const syncFromFile = useStore((s) => s.syncFromFile);
  const reviewInProgress = useStore((s) => s.reviewInProgress);
  const startReview = useStore((s) => s.startReview);

  // Sync from file on mount (picks up changes made by AI/external tools)
  useEffect(() => {
    syncFromFile();
  }, [syncFromFile]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const tasks = useStore((s) => s.tasks);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Full-screen review mode
  if (reviewInProgress) {
    return <WeeklyReview />;
  }

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Taskbed</h1>
        </div>
        <div className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
            onClick={() => setCurrentView('tasks')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="7" />
              <path d="M6 9l2 2 4-4" />
            </svg>
            Tasks
          </button>
          <button
            className={`nav-item ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => setCurrentView('projects')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="12" height="12" rx="2" />
              <path d="M3 7h12" />
            </svg>
            Projects
          </button>

          <div className="nav-divider" />

          <button
            className={`nav-item ${currentView === 'someday' ? 'active' : ''}`}
            onClick={() => setCurrentView('someday')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="7" />
              <path d="M9 5v4l3 2" />
            </svg>
            Someday
            <SomedayCount />
          </button>
          <button
            className={`nav-item ${currentView === 'waiting' ? 'active' : ''}`}
            onClick={() => setCurrentView('waiting')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="7" />
              <path d="M6 9h6" />
            </svg>
            Waiting For
            <WaitingCount />
          </button>

          <button
            className="nav-item review-nav"
            onClick={startReview}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2v4M9 12v4M2 9h4M12 9h4" />
              <circle cx="9" cy="9" r="3" />
            </svg>
            Weekly Review
          </button>
        </div>
        <div className="sidebar-footer">
          <AttributeManager />
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {currentView === 'tasks' && (
          <>
            <header className="content-header">
              <h2>Tasks</h2>
              <GroupingSelector />
            </header>
            <main className="content-body">
              <TaskInput />
              <GroupedTaskList onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
            </main>
          </>
        )}

        {currentView === 'projects' && (
          <ProjectsView />
        )}

        {currentView === 'someday' && (
          <SomedayView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}

        {currentView === 'waiting' && (
          <WaitingView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

export default App;
