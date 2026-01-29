import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TaskInput } from './components/TaskInput';
import { GroupedTaskList } from './components/GroupedTaskList';
import { GroupingSelector } from './components/GroupingSelector';
import { TaskDetail } from './components/TaskDetail';
import { ProjectsView } from './components/ProjectsView';
import { AttributeManager } from './components/AttributeManager';
import { WeeklyReview } from './components/WeeklyReview';
import { DailyReview } from './components/DailyReview';
import { CompletedView } from './components/CompletedView';
import { InboxView } from './components/InboxView';
import { TodayView } from './components/TodayView';
import { SomedayView } from './components/SomedayView';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { Auth } from './components/Auth';
import { useStore, useTemporalStore, subscribeToRealtimeUpdates, setCurrentUserId } from './store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getCurrentSession, onAuthStateChange, signOut, isSupabaseConfigured } from './lib/supabase';
import type { Task } from './types';
import type { User } from '@supabase/supabase-js';
import './App.css';

type View = 'inbox' | 'today' | 'tasks' | 'projects' | 'someday' | 'waiting' | 'completed';

const HASH_TO_VIEW: Record<string, View> = {
  '#/inbox': 'inbox',
  '#/today': 'today',
  '#/tasks': 'tasks',
  '#/projects': 'projects',
  '#/someday': 'someday',
  '#/waiting': 'waiting',
  '#/completed': 'completed',
};

const VIEW_TO_HASH: Record<View, string> = {
  inbox: '#/inbox',
  today: '#/today',
  tasks: '#/tasks',
  projects: '#/projects',
  someday: '#/someday',
  waiting: '#/waiting',
  completed: '#/completed',
};

function getViewFromHash(): View {
  return HASH_TO_VIEW[window.location.hash] ?? 'tasks';
}

// Search result item with highlighted matches
function SearchResultItem({
  task,
  query,
  projectName,
  onSelect,
}: {
  task: Task;
  query: string;
  projectName?: string;
  onSelect: () => void;
}) {
  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  };

  const statusLabel = {
    active: 'Active',
    waiting: 'Waiting',
  };

  return (
    <div className="search-result-item" onClick={onSelect}>
      <span className="search-result-title">{highlightMatch(task.title)}</span>
      <div className="search-result-meta">
        {projectName && (
          <span className="search-result-project">{highlightMatch(projectName)}</span>
        )}
        <span className={`search-result-status status-${task.status || 'active'}`}>
          {statusLabel[task.status || 'active']}
        </span>
        {task.completed && <span className="search-result-completed">Completed</span>}
      </div>
    </div>
  );
}


// Helper to format "waiting since" duration
function formatWaitingDuration(since: number): string {
  const days = Math.floor((Date.now() - since) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// Waiting For View
function WaitingView({ onSelectTask }: { onSelectTask: (task: Task) => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const activateTask = useStore((s) => s.activateTask);
  const toggleTask = useStore((s) => s.toggleTask);

  const waitingTasks = tasks.filter((t) => !t.completed && t.status === 'waiting');
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Capture current time once on mount for consistent rendering
  const [now] = useState(() => Date.now());

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
            <p>Nothing pending. Tasks you're waiting on will appear here.</p>
          </div>
        ) : (
          <div className="status-task-list">
            {sortedTasks.map((task) => {
              const waitingDays = task.waitingSince
                ? Math.floor((now - task.waitingSince) / (1000 * 60 * 60 * 24))
                : 0;
              const isOverdue = waitingDays > 7;

              return (
                <div key={task.id} className="status-task-item waiting-item" onClick={() => onSelectTask(task)}>
                  <div className="status-task-content">
                    <div className="waiting-header">
                      <span className="waiting-for-label">
                        Waiting for <strong>{task.waitingFor || 'something'}</strong>
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
  // Auth state - only show loading if Supabase is configured
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured());

  const [currentView, setCurrentViewState] = useState<View>(getViewFromHash);

  const setCurrentView = useCallback((view: View) => {
    setCurrentViewState(view);
    window.location.hash = VIEW_TO_HASH[view];
  }, []);

  // Sync view state with browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentViewState(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const syncFromFile = useStore((s) => s.syncFromFile);
  const reviewInProgress = useStore((s) => s.reviewInProgress);
  const reviewStep = useStore((s) => s.reviewStep);
  const startReview = useStore((s) => s.startReview);
  const resumeReview = useStore((s) => s.resumeReview);
  const dailyReviewInProgress = useStore((s) => s.dailyReviewInProgress);
  const runMigrationV3 = useStore((s) => s.runMigrationV3);
  const availableTags = useStore((s) => s.availableTags);
  const selectedTagFilter = useStore((s) => s.selectedTagFilter);
  const setTagFilter = useStore((s) => s.setTagFilter);

  // Run migration on first load if needed
  useEffect(() => {
    const migrated = localStorage.getItem('gtd-contexts-migrated');
    if (!migrated) {
      runMigrationV3();
    }
  }, [runMigrationV3]);

  // Undo/Redo
  const undo = useTemporalStore((state) => state.undo);
  const redo = useTemporalStore((state) => state.redo);
  const pastStates = useTemporalStore((state) => state.pastStates);
  const futureStates = useTemporalStore((state) => state.futureStates);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Task input ref for keyboard shortcuts
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    // If Supabase isn't configured, skip auth (local dev mode)
    if (!isSupabaseConfigured()) {
      return;
    }

    let mounted = true;

    getCurrentSession().then(({ session }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        setCurrentUserId(session.user.id);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((newUser) => {
      if (!mounted) return;
      setUser(newUser);
      setCurrentUserId(newUser?.id ?? null);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sync from file/Supabase on mount (picks up changes made by AI/external tools)
  useEffect(() => {
    // Only sync if authenticated (or Supabase not configured)
    if (!isSupabaseConfigured() || user) {
      syncFromFile();
    }
  }, [syncFromFile, user]);

  // Subscribe to real-time updates for cross-device sync
  useEffect(() => {
    // Only subscribe if authenticated
    if (!user) return;
    const unsubscribe = subscribeToRealtimeUpdates();
    return () => unsubscribe();
  }, [user]);

  // Clear daily data when date changes
  const todayDate = useStore((s) => s.todayDate);
  const clearDailyData = useStore((s) => s.clearDailyData);
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (todayDate && todayDate !== today) {
      clearDailyData();
    }
  }, [todayDate, clearDailyData]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Get visible tasks for keyboard navigation (active tasks only, not completed)
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && (t.status === 'active' || !t.status));
  }, [tasks]);

  // Keyboard navigation index
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(-1);

  // Project map for search results
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return tasks.filter((task) => {
      // Search in title
      if (task.title.toLowerCase().includes(query)) return true;
      // Search in notes
      if (task.notes?.toLowerCase().includes(query)) return true;
      // Search in project name
      const project = task.projectId ? projectMap.get(task.projectId) : null;
      if (project?.name.toLowerCase().includes(query)) return true;
      // Search in waitingFor
      if (task.waitingFor?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [tasks, projectMap, searchQuery]);

  // Show search results when there's a query and input is focused
  const showSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  // Handle clicking a search result
  const handleSearchResultSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Close search on Escape
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Keyboard shortcut handlers
  const handleNewTask = useCallback(() => {
    if (currentView === 'tasks') {
      taskInputRef.current?.focus();
    } else {
      setCurrentView('inbox');
    }
  }, [currentView, setCurrentView]);

  const handleNavigateUp = useCallback(() => {
    if (currentView === 'tasks' && visibleTasks.length > 0) {
      setFocusedTaskIndex((prev) => {
        if (prev <= 0) return visibleTasks.length - 1;
        return prev - 1;
      });
    }
  }, [currentView, visibleTasks.length]);

  const handleNavigateDown = useCallback(() => {
    if (currentView === 'tasks' && visibleTasks.length > 0) {
      setFocusedTaskIndex((prev) => {
        if (prev < 0 || prev >= visibleTasks.length - 1) return 0;
        return prev + 1;
      });
    }
  }, [currentView, visibleTasks.length]);

  const handleSelectTask = useCallback(() => {
    if (focusedTaskIndex >= 0 && focusedTaskIndex < visibleTasks.length) {
      setSelectedTaskId(visibleTasks[focusedTaskIndex].id);
    }
  }, [focusedTaskIndex, visibleTasks]);

  const handleEscape = useCallback(() => {
    if (selectedTaskId) {
      setSelectedTaskId(null);
    } else {
      setFocusedTaskIndex(-1);
    }
  }, [selectedTaskId]);

  const handleUndo = useCallback(() => {
    if (pastStates.length > 0) {
      undo();
    }
  }, [pastStates.length, undo]);

  const handleRedo = useCallback(() => {
    if (futureStates.length > 0) {
      redo();
    }
  }, [futureStates.length, redo]);

  const toggleTask = useStore((s) => s.toggleTask);

  const handleToggleComplete = useCallback(() => {
    if (focusedTaskIndex >= 0 && focusedTaskIndex < visibleTasks.length) {
      toggleTask(visibleTasks[focusedTaskIndex].id);
    }
  }, [focusedTaskIndex, visibleTasks, toggleTask]);

  const handleShowHelp = useCallback(() => {
    setShowShortcutsHelp(true);
  }, []);

  // Set up keyboard shortcuts
  useKeyboardShortcuts(
    {
      onNewTask: handleNewTask,
      onNavigateUp: handleNavigateUp,
      onNavigateDown: handleNavigateDown,
      onSelectTask: handleSelectTask,
      onToggleComplete: handleToggleComplete,
      onEscape: handleEscape,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onShowHelp: handleShowHelp,
      enabled: !reviewInProgress && !showShortcutsHelp,
    },
    searchInputRef
  );

  // Loading auth state
  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Taskbed</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Auth gate - show login if Supabase is configured but user not logged in
  if (isSupabaseConfigured() && !user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // Full-screen review mode
  if (reviewInProgress) {
    return <WeeklyReview />;
  }

  // Full-screen daily review mode
  if (dailyReviewInProgress) {
    return <DailyReview />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  // Close sidebar when changing views on mobile
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="app">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {sidebarOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Taskbed</h1>
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={handleSearchKeyDown}
            />
            {showSearchResults && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <div className="search-no-results">No tasks found</div>
                ) : (
                  searchResults.slice(0, 10).map((task) => (
                    <SearchResultItem
                      key={task.id}
                      task={task}
                      query={searchQuery}
                      projectName={task.projectId ? projectMap.get(task.projectId)?.name : undefined}
                      onSelect={() => handleSearchResultSelect(task.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="sidebar-nav">
          {/* Things-style nav items with filled colored icons */}
          <button
            className={`nav-item ${currentView === 'inbox' ? 'active' : ''}`}
            data-view="inbox"
            onClick={() => handleViewChange('inbox')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="3" y="3" width="14" height="14" rx="3" fill="#147efb"/>
            </svg>
            Inbox
          </button>
          <button
            className={`nav-item ${currentView === 'today' ? 'active' : ''}`}
            data-view="today"
            onClick={() => handleViewChange('today')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="#ffcc00"/>
              <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="600" fill="#000">{new Date().getDate()}</text>
            </svg>
            Today
          </button>

          <div className="nav-divider" />

          <button
            className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
            data-view="tasks"
            onClick={() => handleViewChange('tasks')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <rect x="3" y="3" width="14" height="14" rx="3" fill="#5856d6"/>
            </svg>
            Anytime
          </button>
          <button
            className={`nav-item ${currentView === 'projects' ? 'active' : ''}`}
            data-view="projects"
            onClick={() => handleViewChange('projects')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="7" fill="none" stroke="#8a8a8e" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="4" fill="#8a8a8e"/>
            </svg>
            Projects
          </button>

          <div className="nav-divider" />

          <button
            className={`nav-item ${currentView === 'someday' ? 'active' : ''}`}
            data-view="someday"
            onClick={() => handleViewChange('someday')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <rect x="3" y="3" width="14" height="14" rx="3" fill="#af8f60"/>
            </svg>
            Someday
          </button>
          <button
            className={`nav-item ${currentView === 'waiting' ? 'active' : ''}`}
            data-view="waiting"
            onClick={() => handleViewChange('waiting')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="7" fill="none" stroke="#8a8a8e" strokeWidth="1.5"/>
              <path d="M10 6v4l3 2" fill="none" stroke="#8a8a8e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Waiting For
          </button>

          <button
            className={`nav-item ${currentView === 'completed' ? 'active' : ''}`}
            data-view="logbook"
            onClick={() => handleViewChange('completed')}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
              <rect x="3" y="3" width="14" height="14" rx="3" fill="#34c759"/>
              <path d="M7 10l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logbook
          </button>

          {reviewStep > 0 ? (
            <div className="review-nav-group">
              <button
                className="nav-item review-nav resume"
                onClick={() => { resumeReview(); setSidebarOpen(false); }}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="#007aff" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="3" fill="#007aff"/>
                </svg>
                Resume Review
                <span className="review-step-badge">Step {reviewStep + 1}</span>
              </button>
              <button
                className="nav-item review-nav-secondary"
                onClick={() => { startReview(); setSidebarOpen(false); }}
              >
                Start New
              </button>
            </div>
          ) : (
            <button
              className="nav-item review-nav"
              onClick={() => { startReview(); setSidebarOpen(false); }}
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" fill="none" stroke="#007aff" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="3" fill="#007aff"/>
              </svg>
              Weekly Review
            </button>
          )}

          {/* GTD Context Tags Filter */}
          {availableTags.length > 0 && (
            <>
              <div className="nav-divider" />
              <div className="nav-section-label">Contexts</div>
              <button
                className={`nav-item nav-tag ${selectedTagFilter === null ? 'active' : ''}`}
                onClick={() => setTagFilter(null)}
              >
                All Contexts
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className={`nav-item nav-tag ${selectedTagFilter === tag ? 'active' : ''}`}
                  onClick={() => setTagFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="sidebar-footer">
          <AttributeManager />
          {user && (
            <>
              <button className="sync-button" onClick={() => syncFromFile()}>
                Sync from Cloud
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {currentView === 'inbox' && (
          <InboxView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}

        {currentView === 'today' && (
          <TodayView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}

        {currentView === 'tasks' && (
          <>
            <header className="content-header">
              <h2>Tasks</h2>
              <GroupingSelector />
            </header>
            <main className="content-body">
              <TaskInput ref={taskInputRef} />
              <GroupedTaskList
                onSelectTask={(task: Task) => setSelectedTaskId(task.id)}
                focusedTaskId={focusedTaskIndex >= 0 ? visibleTasks[focusedTaskIndex]?.id : undefined}
              />
            </main>
          </>
        )}

        {currentView === 'projects' && (
          <ProjectsView />
        )}

        {currentView === 'someday' && (
          <SomedayView />
        )}

        {currentView === 'waiting' && (
          <WaitingView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}

        {currentView === 'completed' && (
          <CompletedView onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
        )}
      </div>

      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}

export default App;
