import { useState } from 'react';
import { useStore } from '../store';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import type { Task } from '../types';

const TOTAL_STEPS = 8;

export function WeeklyReview() {
  const reviewStep = useStore((s) => s.reviewStep);
  const nextReviewStep = useStore((s) => s.nextReviewStep);
  const prevReviewStep = useStore((s) => s.prevReviewStep);
  const exitReview = useStore((s) => s.exitReview);

  const stepTitles = [
    'Brain Dump',
    'Celebrate Completions',
    'Review Active Tasks',
    'Review Waiting For',
    'Review Projects',
    'Loose Ends',
    'Review Someday',
    'Review Complete',
  ];

  return (
    <div className="weekly-review">
      <header className="review-header">
        <button className="review-exit" onClick={exitReview}>
          Exit Review
        </button>
        <div className="review-progress">
          <span className="review-step-label">
            Step {reviewStep + 1} of {TOTAL_STEPS}: {stepTitles[reviewStep]}
          </span>
          <div className="review-progress-bar">
            <div
              className="review-progress-fill"
              style={{ width: `${((reviewStep + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="review-content">
        {reviewStep === 0 && <BrainDump onNext={nextReviewStep} />}
        {reviewStep === 1 && <CelebrateCompletions onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 2 && <ReviewActiveTasks onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 3 && <ReviewWaitingFor onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 4 && <ReviewProjects onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 5 && <LooseEnds onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 6 && <ReviewSomeday onNext={nextReviewStep} onPrev={prevReviewStep} />}
        {reviewStep === 7 && <ReviewComplete onFinish={exitReview} onPrev={prevReviewStep} />}
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
    <div className="review-step">
      <h2>Brain Dump</h2>
      <p className="review-prompt">
        What's on your mind? Capture anything not yet in your system.
        Write one item per line.
      </p>
      <textarea
        className="review-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter tasks, ideas, worries..."
        rows={12}
        autoFocus
      />
      <div className="review-actions">
        {text.trim() && (
          <button className="review-btn secondary" onClick={handleAddTasks}>
            Add {text.split('\n').filter((l) => l.trim()).length} tasks
          </button>
        )}
        {addedCount > 0 && (
          <span className="review-added-count">{addedCount} tasks added</span>
        )}
        <button className="review-btn primary" onClick={onNext}>
          Done capturing →
        </button>
      </div>
    </div>
  );
}

// Step 2: Celebrate Completions
function CelebrateCompletions({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const [sevenDaysAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedTasks = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt > sevenDaysAgo
  );

  return (
    <div className="review-step">
      <h2>Celebrate Completions</h2>
      <p className="review-prompt">
        Here's what you accomplished in the last 7 days. Take a moment to appreciate your progress.
      </p>
      {completedTasks.length === 0 ? (
        <p className="review-empty">No tasks completed this week. That's okay - let's look ahead.</p>
      ) : (
        <ul className="review-list completed-list">
          {completedTasks.map((task) => (
            <li key={task.id} className="review-list-item completed">
              <span className="checkmark">✓</span>
              {task.title}
            </li>
          ))}
        </ul>
      )}
      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">{completedTasks.length} completed</span>
        <button className="review-btn primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

// Step 3: Review Active Tasks (scan by project, not one-by-one)
function ReviewActiveTasks({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const areas = useStore((s) => s.areas);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const [deletedCount, setDeletedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const activeTasks = tasks.filter((t) => !t.completed);

  // Group tasks by project
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const areaMap = new Map(areas.map((a) => [a.id, a]));

  // Build grouped structure: Project -> Tasks
  const grouped: { projectId: string | undefined; tasks: typeof activeTasks }[] = [];
  const seenProjects = new Set<string | undefined>();

  activeTasks.forEach((task) => {
    const key = task.projectId;
    if (!seenProjects.has(key)) {
      seenProjects.add(key);
      grouped.push({ projectId: key, tasks: [] });
    }
    grouped.find((g) => g.projectId === key)!.tasks.push(task);
  });

  // Sort projects by area, then by name
  grouped.sort((a, b) => {
    const projA = a.projectId ? projectMap.get(a.projectId) : null;
    const projB = b.projectId ? projectMap.get(b.projectId) : null;
    // No project goes last
    if (!projA && projB) return 1;
    if (projA && !projB) return -1;
    if (!projA && !projB) return 0;
    // Sort by area, then by project name
    const areaA = projA?.areaId ? areaMap.get(projA.areaId)?.name || '' : '';
    const areaB = projB?.areaId ? areaMap.get(projB.areaId)?.name || '' : '';
    if (areaA !== areaB) return areaA.localeCompare(areaB);
    return (projA?.name || '').localeCompare(projB?.name || '');
  });

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
    setDeletedCount((c) => c + 1);
  };

  const handleComplete = (taskId: string) => {
    toggleTask(taskId);
    setCompletedCount((c) => c + 1);
  };

  return (
    <div className="review-step">
      <h2>Review Active Tasks</h2>
      <p className="review-prompt">
        Scan your tasks by project. Mark any as done or delete what's no longer relevant.
        You don't need to act on every task—just what catches your eye.
      </p>

      {activeTasks.length === 0 ? (
        <p className="review-empty">No active tasks to review.</p>
      ) : (
        <div className="review-scan-list">
          {grouped.map((group) => {
            const project = group.projectId ? projectMap.get(group.projectId) : null;
            const area = project?.areaId ? areaMap.get(project.areaId) : null;

            return (
              <div key={group.projectId || 'no-project'} className="review-project-group">
                <div className="review-project-header">
                  <span className="review-project-name">
                    {project?.name || 'No Project'}
                  </span>
                  {area && (
                    <span className="review-area-badge">{area.name}</span>
                  )}
                  <span className="review-task-count">{group.tasks.length} tasks</span>
                </div>
                <ul className="review-scan-tasks">
                  {group.tasks.map((task) => (
                    <li key={task.id} className="review-scan-task">
                      <span className="review-scan-task-title">{task.title}</span>
                      <div className="review-scan-task-actions">
                        <button
                          className="review-scan-btn complete"
                          onClick={() => handleComplete(task.id)}
                          title="Mark done"
                        >
                          ✓
                        </button>
                        <button
                          className="review-scan-btn danger"
                          onClick={() => handleDelete(task.id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">
          {activeTasks.length} tasks · {completedCount} done · {deletedCount} deleted
        </span>
        <button className="review-btn primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

// Step 4: Review Projects
function ReviewProjects({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const deleteProject = useStore((s) => s.deleteProject);
  const completeProject = useStore((s) => s.completeProject);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [completedCount, setCompletedCount] = useState(0);

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId && !t.completed).length;
  };

  const handleAddTask = (projectId: string) => {
    const title = newTaskInputs[projectId]?.trim();
    if (title) {
      addTask(title, { projectId });
      setNewTaskInputs({ ...newTaskInputs, [projectId]: '' });
    }
  };

  const handleCompleteProject = (projectId: string) => {
    completeProject(projectId);
    setCompletedCount((c) => c + 1);
  };

  // Filter out already-completed projects
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === undefined);

  const projectsWithCounts = activeProjects.map((p) => ({
    ...p,
    taskCount: getProjectTaskCount(p.id),
  }));

  const stuckProjects = projectsWithCounts.filter((p) => p.taskCount === 0);
  const healthyProjects = projectsWithCounts.filter((p) => p.taskCount > 0);

  return (
    <div className="review-step">
      <h2>Review Projects</h2>
      <p className="review-prompt">
        Does each project have at least one next action? Projects without tasks are stuck.
      </p>

      {stuckProjects.length > 0 && (
        <>
          <h3 className="review-subheading">Stuck Projects (no next action)</h3>
          <ul className="review-list project-list">
            {stuckProjects.map((project) => (
              <li key={project.id} className="review-list-item stuck">
                <div className="project-header">
                  <span className="project-name">{project.name}</span>
                  <span className="project-warning">No tasks!</span>
                </div>
                <div className="project-actions">
                  <input
                    type="text"
                    placeholder="Add a next action..."
                    value={newTaskInputs[project.id] || ''}
                    onChange={(e) =>
                      setNewTaskInputs({ ...newTaskInputs, [project.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(project.id);
                    }}
                  />
                  <button
                    className="review-btn small success"
                    onClick={() => handleAddTask(project.id)}
                  >
                    Add
                  </button>
                  <button
                    className="review-btn small complete"
                    onClick={() => handleCompleteProject(project.id)}
                  >
                    Complete
                  </button>
                  <button
                    className="review-btn small danger"
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {healthyProjects.length > 0 && (
        <>
          <h3 className="review-subheading">Active Projects</h3>
          <ul className="review-list project-list">
            {healthyProjects.map((project) => (
              <li key={project.id} className="review-list-item healthy">
                <div className="project-header">
                  <span className="project-name">{project.name}</span>
                  <span className="project-count">{project.taskCount} tasks</span>
                </div>
                <div className="project-actions">
                  <button
                    className="review-btn small complete"
                    onClick={() => handleCompleteProject(project.id)}
                  >
                    Complete
                  </button>
                  <button
                    className="review-btn small danger"
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {projects.length === 0 && (
        <p className="review-empty">No projects yet.</p>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">
          {stuckProjects.length} stuck · {healthyProjects.length} healthy{completedCount > 0 ? ` · ${completedCount} completed` : ''}
        </span>
        <button className="review-btn primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

// Draggable task component for Loose Ends
function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="loose-task-draggable"
    >
      <span className="drag-handle">⋮⋮</span>
      <span className="loose-task-title">{task.title}</span>
    </div>
  );
}

// Droppable project zone
function DroppableProject({ projectId, name, taskCount, isOver }: {
  projectId: string;
  name: string;
  taskCount: number;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: projectId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`project-drop-zone ${isOver ? 'drop-active' : ''}`}
    >
      <span className="project-drop-name">{name}</span>
      <span className="project-drop-count">{taskCount} tasks</span>
    </div>
  );
}

// Step 5: Loose Ends with drag-and-drop
function LooseEnds({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const updateTask = useStore((s) => s.updateTask);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overProjectId, setOverProjectId] = useState<string | null>(null);
  const [assignedCount, setAssignedCount] = useState(0);

  const looseTasks = tasks.filter((t) => !t.completed && !t.projectId);
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverProjectId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const projectId = over.id as string;
      updateTask(active.id as string, { projectId });
      setAssignedCount((c) => c + 1);
    }

    setActiveId(null);
    setOverProjectId(null);
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId && !t.completed).length;
  };

  return (
    <div className="review-step">
      <h2>Loose Ends</h2>
      <p className="review-prompt">
        Drag tasks to assign them to projects, or leave them as standalone actions.
      </p>

      {looseTasks.length === 0 ? (
        <p className="review-empty">No loose tasks - everything is organized!</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="loose-ends-layout">
            {/* Left side: Loose tasks */}
            <div className="loose-tasks-panel">
              <h3 className="panel-header">Unassigned Tasks ({looseTasks.length})</h3>
              <div className="loose-tasks-list">
                {looseTasks.map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Right side: Project drop zones */}
            <div className="projects-panel">
              <h3 className="panel-header">Projects</h3>
              <div className="project-drop-zones">
                {projects.map((project) => (
                  <DroppableProject
                    key={project.id}
                    projectId={project.id}
                    name={project.name}
                    taskCount={getProjectTaskCount(project.id)}
                    isOver={overProjectId === project.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Drag overlay for smooth animation */}
          <DragOverlay>
            {activeTask ? (
              <div className="loose-task-draggable dragging">
                <span className="drag-handle">⋮⋮</span>
                <span className="loose-task-title">{activeTask.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">
          {looseTasks.length} loose · {assignedCount} assigned
        </span>
        <button className="review-btn primary" onClick={onNext}>
          Finish Review →
        </button>
      </div>
    </div>
  );
}

// Helper to format waiting duration
function formatWaitingDuration(since: number): string {
  const days = Math.floor((Date.now() - since) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// Step 4: Review Waiting For
function ReviewWaitingFor({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const toggleTask = useStore((s) => s.toggleTask);
  const activateTask = useStore((s) => s.activateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [completedCount, setCompletedCount] = useState(0);
  const [followedUpCount, setFollowedUpCount] = useState(0);

  // Capture current time once on mount for consistent rendering
  const [now] = useState(() => Date.now());

  const waitingTasks = tasks.filter((t) => !t.completed && t.status === 'waiting');

  // Sort by waiting duration (oldest first - needs attention)
  const sortedTasks = [...waitingTasks].sort((a, b) =>
    (a.waitingSince || 0) - (b.waitingSince || 0)
  );

  const handleComplete = (taskId: string) => {
    toggleTask(taskId);
    setCompletedCount((c) => c + 1);
  };

  const handleFollowUp = (taskId: string) => {
    activateTask(taskId);
    setFollowedUpCount((c) => c + 1);
  };

  return (
    <div className="review-step">
      <h2>Review Waiting For</h2>
      <p className="review-prompt">
        Check on items you're waiting for. Did you receive a response? Need to follow up?
      </p>

      {sortedTasks.length === 0 ? (
        <p className="review-empty">No pending items from others.</p>
      ) : (
        <div className="review-scan-list">
          {sortedTasks.map((task) => {
            const waitingDays = task.waitingSince
              ? Math.floor((now - task.waitingSince) / (1000 * 60 * 60 * 24))
              : 0;
            const isOverdue = waitingDays > 7;

            return (
              <div key={task.id} className="waiting-review-item">
                <div className="waiting-review-header">
                  <span className="waiting-for-badge">
                    Waiting for <strong>{task.waitingFor || 'something'}</strong>
                  </span>
                  <span className={`waiting-age ${isOverdue ? 'overdue' : ''}`}>
                    {task.waitingSince ? formatWaitingDuration(task.waitingSince) : ''}
                  </span>
                </div>
                <div className="waiting-review-content">
                  <span className="waiting-review-title">{task.title}</span>
                  <div className="waiting-review-actions">
                    <button
                      className="review-scan-btn complete"
                      onClick={() => handleComplete(task.id)}
                      title="Received / Done"
                    >
                      Done
                    </button>
                    <button
                      className="review-scan-btn followup"
                      onClick={() => handleFollowUp(task.id)}
                      title="Need to follow up"
                    >
                      Follow up
                    </button>
                    <button
                      className="review-scan-btn danger"
                      onClick={() => deleteTask(task.id)}
                      title="No longer needed"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">
          {waitingTasks.length} waiting · {completedCount} received · {followedUpCount} follow up
        </span>
        <button className="review-btn primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

// Step 7: Review Someday
function ReviewSomeday({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const activateTask = useStore((s) => s.activateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [activatedCount, setActivatedCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  const somedayTasks = tasks.filter((t) => !t.completed && t.status === 'someday');

  const handleActivate = (taskId: string) => {
    activateTask(taskId);
    setActivatedCount((c) => c + 1);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
    setDeletedCount((c) => c + 1);
  };

  return (
    <div className="review-step">
      <h2>Review Someday / Maybe</h2>
      <p className="review-prompt">
        Scan your someday list. Is there anything you're now ready to commit to?
        Delete items that no longer resonate.
      </p>

      {somedayTasks.length === 0 ? (
        <p className="review-empty">No someday items to review.</p>
      ) : (
        <div className="review-scan-list">
          {somedayTasks.map((task) => (
            <div key={task.id} className="review-scan-task someday-task">
              <span className="review-scan-task-title">{task.title}</span>
              <div className="review-scan-task-actions">
                <button
                  className="review-scan-btn activate"
                  onClick={() => handleActivate(task.id)}
                  title="Move to active"
                >
                  Activate
                </button>
                <button
                  className="review-scan-btn danger"
                  onClick={() => handleDelete(task.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <span className="review-count">
          {somedayTasks.length} someday · {activatedCount} activated · {deletedCount} deleted
        </span>
        <button className="review-btn primary" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

// Step 8: Complete
function ReviewComplete({ onFinish, onPrev }: { onFinish: () => void; onPrev: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);

  const activeTasks = tasks.filter((t) => !t.completed).length;
  const [sevenDaysAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt > sevenDaysAgo
  ).length;

  return (
    <div className="review-step review-complete">
      <h2>Weekly Review Complete!</h2>
      <p className="review-prompt">
        Your system is up to date. You can trust it for the week ahead.
      </p>

      <div className="review-summary">
        <div className="summary-stat">
          <span className="stat-number">{completedThisWeek}</span>
          <span className="stat-label">completed this week</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">{activeTasks}</span>
          <span className="stat-label">active tasks</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">{projects.length}</span>
          <span className="stat-label">projects</span>
        </div>
      </div>

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onPrev}>
          ← Back
        </button>
        <button className="review-btn primary large" onClick={onFinish}>
          Return to Tasks
        </button>
      </div>
    </div>
  );
}
