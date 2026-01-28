import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { TwoMinuteTimer } from './TwoMinuteTimer';
import type { Task } from '../types';

const CONTEXTS = [
  { id: '@deep', label: '@deep', description: 'Focused, uninterrupted' },
  { id: '@shallow', label: '@shallow', description: 'Quick, interruptible' },
  { id: '@calls', label: '@calls', description: 'Need to talk' },
  { id: '@out', label: '@out', description: 'Away from home/office' },
  { id: '@offline', label: '@offline', description: 'No internet needed' },
];

export function DailyReview() {
  const dailyReviewStep = useStore((s) => s.dailyReviewStep);
  const nextDailyReviewStep = useStore((s) => s.nextDailyReviewStep);
  const exitDailyReview = useStore((s) => s.exitDailyReview);
  const dailyReviewProcessedCount = useStore((s) => s.dailyReviewProcessedCount);

  const stepTitles = ['Process Inbox', 'Check Calendar', 'Get Clear'];

  return (
    <div className="daily-review">
      <header className="review-header">
        <button className="review-exit" onClick={exitDailyReview}>
          Exit
        </button>
        <div className="review-progress">
          <span className="review-step-label">
            Step {dailyReviewStep + 1} of 3: {stepTitles[dailyReviewStep]}
          </span>
          <div className="review-progress-bar">
            <div
              className="review-progress-fill"
              style={{ width: `${((dailyReviewStep + 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="review-content">
        {dailyReviewStep === 0 && <ProcessInbox onNext={nextDailyReviewStep} />}
        {dailyReviewStep === 1 && <CheckCalendar onNext={nextDailyReviewStep} />}
        {dailyReviewStep === 2 && (
          <GetClear processedCount={dailyReviewProcessedCount} onComplete={exitDailyReview} />
        )}
      </main>
    </div>
  );
}

// Step 1: Process Inbox
function ProcessInbox({ onNext }: { onNext: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const setTaskContext = useStore((s) => s.setTaskContext);
  const moveToWaiting = useStore((s) => s.moveToWaiting);
  const addSomedayItem = useStore((s) => s.addSomedayItem);
  const addProject = useStore((s) => s.addProject);
  const addTask = useStore((s) => s.addTask);
  const markTaskProcessed = useStore((s) => s.markTaskProcessed);
  const incrementDailyReviewProcessed = useStore((s) => s.incrementDailyReviewProcessed);

  // Get unprocessed inbox items
  const inboxItems = useMemo(
    () => tasks.filter((t) => !t.completed && !t.processed && t.status === 'active'),
    [tasks]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'decide' | 'timer' | 'context' | 'waiting' | 'project'>('decide');
  const [waitingFor, setWaitingFor] = useState('');
  const [projectName, setProjectName] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [selectedContext, setSelectedContext] = useState('@shallow');

  const currentItem = inboxItems[currentIndex] as Task | undefined;
  const totalItems = inboxItems.length;

  const goToNext = () => {
    incrementDailyReviewProcessed();
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
      setMode('decide');
      setWaitingFor('');
      setProjectName('');
      setFirstAction('');
      setSelectedContext('@shallow');
    } else {
      onNext();
    }
  };

  // No items to process
  if (!currentItem) {
    return (
      <div className="review-step">
        <h2>Process Inbox</h2>
        <div className="inbox-empty-state">
          <p>Your inbox is clear!</p>
          <button className="review-btn primary" onClick={onNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // 2-minute timer mode
  if (mode === 'timer') {
    return (
      <div className="review-step">
        <TwoMinuteTimer
          taskTitle={currentItem.title}
          onComplete={() => {
            toggleTask(currentItem.id);
            markTaskProcessed(currentItem.id);
            goToNext();
          }}
          onAddToActive={() => {
            setMode('context');
          }}
          onCancel={() => setMode('decide')}
        />
      </div>
    );
  }

  // Context selection mode
  if (mode === 'context') {
    return (
      <div className="review-step">
        <h2>What context?</h2>
        <p className="review-prompt">"{currentItem.title}"</p>
        <div className="context-selector">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              className={`context-option ${selectedContext === ctx.id ? 'selected' : ''}`}
              onClick={() => setSelectedContext(ctx.id)}
            >
              <span className="context-label">{ctx.label}</span>
              <span className="context-description">{ctx.description}</span>
            </button>
          ))}
        </div>
        <div className="review-actions">
          <button className="review-btn secondary" onClick={() => setMode('decide')}>
            ← Back
          </button>
          <button
            className="review-btn primary"
            onClick={() => {
              setTaskContext(currentItem.id, selectedContext);
              goToNext();
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // Waiting for mode
  if (mode === 'waiting') {
    return (
      <div className="review-step">
        <h2>Waiting for what?</h2>
        <p className="review-prompt">"{currentItem.title}"</p>
        <input
          type="text"
          className="review-input"
          value={waitingFor}
          onChange={(e) => setWaitingFor(e.target.value)}
          placeholder="e.g., Response from John, Package delivery..."
          autoFocus
        />
        <div className="review-actions">
          <button className="review-btn secondary" onClick={() => setMode('decide')}>
            ← Back
          </button>
          <button
            className="review-btn primary"
            disabled={!waitingFor.trim()}
            onClick={() => {
              moveToWaiting(currentItem.id, waitingFor.trim());
              goToNext();
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // Project creation mode
  if (mode === 'project') {
    return (
      <div className="review-step">
        <h2>Create Project</h2>
        <p className="review-prompt">From: "{currentItem.title}"</p>

        <label className="review-label">Project name</label>
        <input
          type="text"
          className="review-input"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g., Plan vacation, Learn Spanish..."
          autoFocus
        />

        <label className="review-label">First next action</label>
        <input
          type="text"
          className="review-input"
          value={firstAction}
          onChange={(e) => setFirstAction(e.target.value)}
          placeholder="What's the very next physical action?"
        />

        <label className="review-label">Context for first action</label>
        <div className="context-selector compact">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              className={`context-option ${selectedContext === ctx.id ? 'selected' : ''}`}
              onClick={() => setSelectedContext(ctx.id)}
            >
              {ctx.label}
            </button>
          ))}
        </div>

        <div className="review-actions">
          <button className="review-btn secondary" onClick={() => setMode('decide')}>
            ← Back
          </button>
          <button
            className="review-btn primary"
            disabled={!projectName.trim() || !firstAction.trim()}
            onClick={() => {
              const projectId = addProject(projectName.trim());
              addTask(firstAction.trim(), {
                projectId,
                tags: [selectedContext],
                processed: true,
              });
              deleteTask(currentItem.id);
              goToNext();
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  // Main decision mode
  return (
    <div className="review-step">
      <h2>Process Inbox</h2>
      <p className="inbox-progress">Item {currentIndex + 1} of {totalItems}</p>

      <div className="inbox-item-card">
        <p className="inbox-item-title">{currentItem.title}</p>
        {currentItem.notes && (
          <p className="inbox-item-notes">{currentItem.notes}</p>
        )}
      </div>

      <p className="review-prompt">What is this? Is it actionable?</p>

      <div className="inbox-decisions">
        <button className="decision-btn timer" onClick={() => setMode('timer')}>
          <span className="decision-icon">&#9201;</span>
          <span className="decision-label">Do it now</span>
          <span className="decision-hint">&lt; 2 min</span>
        </button>

        <div className="decision-row">
          <button className="decision-btn action" onClick={() => setMode('context')}>
            <span className="decision-label">Next action</span>
          </button>
          <button className="decision-btn project" onClick={() => setMode('project')}>
            <span className="decision-label">Project</span>
          </button>
        </div>

        <div className="decision-row">
          <button className="decision-btn waiting" onClick={() => setMode('waiting')}>
            <span className="decision-label">Waiting for</span>
          </button>
          <button
            className="decision-btn someday"
            onClick={() => {
              addSomedayItem(currentItem.title, currentItem.notes);
              deleteTask(currentItem.id);
              goToNext();
            }}
          >
            <span className="decision-label">Someday</span>
          </button>
        </div>

        <div className="decision-row">
          <button
            className="decision-btn trash"
            onClick={() => {
              deleteTask(currentItem.id);
              goToNext();
            }}
          >
            <span className="decision-label">Trash</span>
          </button>
          <button
            className="decision-btn reference"
            onClick={() => {
              deleteTask(currentItem.id);
              goToNext();
            }}
          >
            <span className="decision-label">Reference</span>
            <span className="decision-hint">(not here)</span>
          </button>
        </div>
      </div>

      <div className="inbox-progress-bar">
        <div
          className="inbox-progress-fill"
          style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Step 2: Check Calendar
function CheckCalendar({ onNext }: { onNext: () => void }) {
  return (
    <div className="review-step calendar-step">
      <h2>Check Calendar</h2>
      <p className="review-prompt">
        Glance at your calendar. What's your hard landscape today?
      </p>
      <div className="calendar-reminder">
        <p>Take a moment to review your commitments.</p>
      </div>
      <button className="review-btn primary" onClick={onNext}>
        Continue →
      </button>
    </div>
  );
}

// Step 3: Get Clear
function GetClear({ processedCount, onComplete }: { processedCount: number; onComplete: () => void }) {
  const tasks = useStore((s) => s.tasks);

  // Find stale waiting items (> 7 days)
  const staleWaiting = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return tasks.filter(
      (t) => t.status === 'waiting' && t.waitingSince && t.waitingSince < sevenDaysAgo
    );
  }, [tasks]);

  return (
    <div className="review-step get-clear-step">
      <h2>Get Clear</h2>

      <div className="clear-summary">
        <p className="clear-stat">
          <span className="stat-number">{processedCount}</span>
          <span className="stat-label">items processed</span>
        </p>
      </div>

      {staleWaiting.length > 0 && (
        <div className="stale-waiting-alert">
          <h3>Waiting for &gt; 7 days</h3>
          <p>Consider following up on these:</p>
          <ul className="stale-list">
            {staleWaiting.map((task) => (
              <li key={task.id}>
                <span className="stale-title">{task.title}</span>
                {task.waitingFor && (
                  <span className="stale-waiting-for">— {task.waitingFor}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="review-btn primary large" onClick={onComplete}>
        Start your day
      </button>
    </div>
  );
}
