import { useState, useMemo } from 'react';
import { useStore } from '../store';

const TOTAL_STEPS = 3;

interface MorningFocusProps {
  onComplete: () => void;
}

export function MorningFocus({ onComplete }: MorningFocusProps) {
  const morningFocusStep = useStore((s) => s.morningFocusStep);
  const nextMorningFocusStep = useStore((s) => s.nextMorningFocusStep);
  const prevMorningFocusStep = useStore((s) => s.prevMorningFocusStep);
  const exitMorningFocus = useStore((s) => s.exitMorningFocus);

  const stepTitles = ['Brain Dump', 'Choose Your Focus', 'Set Your Intention'];

  return (
    <div className="morning-focus">
      <header className="focus-header">
        <button className="focus-exit" onClick={exitMorningFocus}>
          Exit
        </button>
        <div className="focus-progress">
          <span className="focus-step-label">
            Step {morningFocusStep + 1} of {TOTAL_STEPS}: {stepTitles[morningFocusStep]}
          </span>
          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${((morningFocusStep + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="focus-content">
        {morningFocusStep === 0 && <BrainDump onNext={nextMorningFocusStep} />}
        {morningFocusStep === 1 && (
          <ChooseFocus onNext={nextMorningFocusStep} onPrev={prevMorningFocusStep} />
        )}
        {morningFocusStep === 2 && (
          <SetIntention onPrev={prevMorningFocusStep} onComplete={onComplete} />
        )}
      </main>
    </div>
  );
}

// Step 1: Brain Dump
function BrainDump({ onNext }: { onNext: () => void }) {
  const [text, setText] = useState('');
  const addTask = useStore((s) => s.addTask);
  const [addedCount, setAddedCount] = useState(0);

  const handleAddTasks = () => {
    const lines = text.split('\n').filter((line) => line.trim());
    lines.forEach((line) => {
      addTask(line.trim());
    });
    setAddedCount(addedCount + lines.length);
    setText('');
  };

  return (
    <div className="focus-step">
      <h2>Brain Dump</h2>
      <p className="focus-prompt">
        Get anything off your mind. Write one item per line.
      </p>
      <textarea
        className="focus-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter tasks, ideas, worries..."
        rows={10}
        autoFocus
      />
      <div className="focus-actions">
        {text.trim() && (
          <button className="focus-btn secondary" onClick={handleAddTasks}>
            Add {text.split('\n').filter((l) => l.trim()).length} to inbox
          </button>
        )}
        {addedCount > 0 && (
          <span className="focus-added-count">{addedCount} added</span>
        )}
        <button className="focus-btn primary" onClick={onNext}>
          {addedCount > 0 || !text.trim() ? 'Continue' : 'Skip'} →
        </button>
      </div>
    </div>
  );
}

// Step 2: Choose Focus
function ChooseFocus({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [quickAddText, setQuickAddText] = useState('');
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const areas = useStore((s) => s.areas);
  const todayTaskIds = useStore((s) => s.todayTaskIds);
  const toggleTodayTask = useStore((s) => s.toggleTodayTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addTask = useStore((s) => s.addTask);

  // Only show active, incomplete tasks
  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed && (t.status === 'active' || !t.status)),
    [tasks]
  );

  // Group tasks by project
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const areaMap = new Map(areas.map((a) => [a.id, a]));

  const grouped = useMemo(() => {
    const groups: { projectId: string | null; tasks: typeof activeTasks }[] = [];
    const seenProjects = new Set<string | null>();

    activeTasks.forEach((task) => {
      // Normalize: treat undefined and '' as null (no project)
      const key = task.projectId || null;
      if (!seenProjects.has(key)) {
        seenProjects.add(key);
        groups.push({ projectId: key, tasks: [] });
      }
      groups.find((g) => g.projectId === key)!.tasks.push(task);
    });

    // Sort by area, then by project name, "No Project" last
    groups.sort((a, b) => {
      const projA = a.projectId ? projectMap.get(a.projectId) : null;
      const projB = b.projectId ? projectMap.get(b.projectId) : null;
      if (!projA && projB) return 1;
      if (projA && !projB) return -1;
      if (!projA && !projB) return 0;
      const areaA = projA?.areaId ? areaMap.get(projA.areaId)?.name || '' : '';
      const areaB = projB?.areaId ? areaMap.get(projB.areaId)?.name || '' : '';
      if (areaA !== areaB) return areaA.localeCompare(areaB);
      return (projA?.name || '').localeCompare(projB?.name || '');
    });

    return groups;
  }, [activeTasks, projectMap, areaMap]);

  const selectedCount = todayTaskIds.length;

  return (
    <div className="focus-step">
      <h2>Choose Your Focus</h2>
      <p className="focus-prompt">
        What matters today? Select the tasks you want to focus on.
      </p>

      <div className="focus-task-selector">
        {grouped.map((group) => {
          const project = group.projectId ? projectMap.get(group.projectId) : null;
          const area = project?.areaId ? areaMap.get(project.areaId) : null;

          return (
            <div key={group.projectId || 'no-project'} className="focus-project-group">
              <div className="focus-project-header">
                <span className="focus-project-name">
                  {project?.name || 'No Project'}
                </span>
                {area && <span className="focus-area-badge">{area.name}</span>}
              </div>
              <div className="focus-project-tasks">
                {group.tasks.map((task) => {
                  const isSelected = todayTaskIds.includes(task.id);
                  return (
                    <div key={task.id} className={`focus-task-item ${isSelected ? 'selected' : ''}`}>
                      <label className="focus-task-select">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTodayTask(task.id)}
                        />
                        <span className="focus-task-title">{task.title}</span>
                        {task.dueDate && (
                          <span className="focus-task-due">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </label>
                      <div className="focus-task-actions">
                        <button
                          className="focus-task-action complete"
                          onClick={() => toggleTask(task.id)}
                          title="Mark complete"
                        >
                          ✓
                        </button>
                        <button
                          className="focus-task-action delete"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quick add section */}
        <div className="focus-quick-add">
          <input
            type="text"
            className="focus-quick-add-input"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder="+ Add a task..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickAddText.trim()) {
                const newTaskId = addTask(quickAddText.trim());
                toggleTodayTask(newTaskId);
                setQuickAddText('');
              }
            }}
          />
        </div>
      </div>

      <div className="focus-actions">
        <button className="focus-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="focus-count">{selectedCount} selected</span>
        <button className="focus-btn primary" onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// Step 3: Set Intention
function SetIntention({
  onPrev,
  onComplete,
}: {
  onPrev: () => void;
  onComplete: () => void;
}) {
  const [intention, setIntention] = useState('');
  const todayTaskIds = useStore((s) => s.todayTaskIds);
  const completeMorningFocus = useStore((s) => s.completeMorningFocus);

  const handleComplete = () => {
    completeMorningFocus(intention.trim(), todayTaskIds);
    onComplete();
  };

  return (
    <div className="focus-step intention-step">
      <h2>Set Your Intention</h2>
      <p className="focus-prompt">
        What would make today successful?
      </p>
      <input
        type="text"
        className="focus-intention-input"
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        placeholder="e.g., Ship the login feature, Feel less frazzled, Be present..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && intention.trim()) {
            handleComplete();
          }
        }}
      />
      <div className="focus-actions">
        <button className="focus-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <button
          className="focus-btn primary large"
          onClick={handleComplete}
          disabled={!intention.trim()}
        >
          Start my day
        </button>
      </div>
    </div>
  );
}
