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

type View = 'tasks' | 'projects';

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
