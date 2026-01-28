import { useMemo } from 'react';
import { useStore } from '../store';
import { MorningFocus } from './MorningFocus';
import type { Task } from '../types';

interface TodayViewProps {
  onSelectTask: (task: Task) => void;
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function TodayView({ onSelectTask }: TodayViewProps) {
  const tasks = useStore((s) => s.tasks);
  const dailyIntention = useStore((s) => s.dailyIntention);
  const todayTaskIds = useStore((s) => s.todayTaskIds);
  const todayDate = useStore((s) => s.todayDate);
  const morningFocusInProgress = useStore((s) => s.morningFocusInProgress);
  const startMorningFocus = useStore((s) => s.startMorningFocus);
  const toggleTask = useStore((s) => s.toggleTask);
  const clearDailyData = useStore((s) => s.clearDailyData);

  // Check if we have a valid focus for today
  const hasTodayFocus = todayDate === getTodayISO() && todayTaskIds.length > 0;

  // Get today's tasks (filter out any that were deleted)
  const todayTasks = useMemo(() => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return todayTaskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => t !== undefined);
  }, [tasks, todayTaskIds]);

  // Separate completed from incomplete
  const incompleteTasks = todayTasks.filter((t) => !t.completed);
  const completedTasks = todayTasks.filter((t) => t.completed);

  // If morning focus is in progress, show the flow
  if (morningFocusInProgress) {
    return <MorningFocus onComplete={() => {}} />;
  }

  // If no focus for today, show prompt
  if (!hasTodayFocus) {
    return (
      <>
        <header className="content-header">
          <h2>Today</h2>
        </header>
        <main className="content-body">
          <div className="today-empty">
            <div className="today-empty-content">
              <h3>Start your morning focus</h3>
              <p>
                Take a few minutes to clear your head, choose what matters today,
                and set an intention for the day.
              </p>
              <button className="today-start-btn" onClick={startMorningFocus}>
                Begin Morning Focus
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Show today's focus
  return (
    <>
      <header className="content-header">
        <h2>Today</h2>
        <button className="today-redo-btn" onClick={() => { clearDailyData(); startMorningFocus(); }}>
          Redo focus
        </button>
      </header>
      <main className="content-body">
        <div className="today-view">
          {dailyIntention && (
            <div className="today-intention">
              <span className="intention-label">Today's intention</span>
              <p className="intention-text">{dailyIntention}</p>
            </div>
          )}

          <div className="today-tasks">
            {incompleteTasks.length === 0 && completedTasks.length === 0 && (
              <p className="today-all-done">No tasks selected for today.</p>
            )}

            {incompleteTasks.length === 0 && completedTasks.length > 0 && (
              <div className="today-celebration">
                <span className="celebration-emoji">&#127881;</span>
                <p>You've completed everything for today!</p>
              </div>
            )}

            {incompleteTasks.map((task) => (
              <div
                key={task.id}
                className="today-task-item"
                onClick={() => onSelectTask(task)}
              >
                <button
                  className="task-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                  aria-label="Complete task"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" className="checkbox-circle" />
                  </svg>
                </button>
                <span className="today-task-title">{task.title}</span>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div className="today-completed-section">
                <h4 className="today-completed-header">Completed</h4>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="today-task-item completed"
                    onClick={() => onSelectTask(task)}
                  >
                    <button
                      className="task-checkbox completed"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      aria-label="Uncomplete task"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" className="checkbox-circle" />
                        <path d="M5.5 9.5L8 12L12.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="checkbox-check" />
                      </svg>
                    </button>
                    <span className="today-task-title">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
