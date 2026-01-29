import { useState } from 'react';
import { useStore } from '../store';
import type { Task } from '../types';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const {
    updateTask,
    deleteTask,
    projects,
    areas,
    moveToWaiting,
    activateTask,
    availableTags,
    addTagToTask,
    removeTagFromTask,
    setDueDate,
    toggleTask,
  } = useStore();

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [showWaitingPrompt, setShowWaitingPrompt] = useState(false);
  const [waitingFor, setWaitingFor] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  const taskTags = task.tags || [];
  const currentProject = projects.find((p) => p.id === task.projectId);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (task.notes || '')) {
      updateTask(task.id, { notes: notes || undefined });
    }
  };

  const handleProjectChange = (projectId: string) => {
    updateTask(task.id, { projectId: projectId || undefined });
  };

  const handleAreaChange = (areaId: string) => {
    updateTask(task.id, { areaId: areaId || undefined });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleComplete = () => {
    toggleTask(task.id);
    onClose();
  };

  const handleMoveToWaiting = () => {
    if (waitingFor.trim()) {
      moveToWaiting(task.id, waitingFor.trim());
      setShowWaitingPrompt(false);
      setWaitingFor('');
      onClose();
    }
  };

  const handleActivate = () => {
    activateTask(task.id);
  };

  const currentStatus = task.status || 'active';

  return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className="task-detail things-style" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="task-detail-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        {/* Main content area - like a clean white paper */}
        <div className="task-detail-paper">
          {/* Checkbox + Title */}
          <div className="task-detail-title-row">
            <button className="task-detail-checkbox" onClick={handleComplete}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="9" />
              </svg>
            </button>
            <input
              type="text"
              className="task-detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="Task title"
            />
          </div>

          {/* Project indicator */}
          {currentProject && (
            <div className="task-detail-project-badge">
              {currentProject.name}
            </div>
          )}

          {/* Notes - main content area */}
          <textarea
            className="task-detail-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Notes"
            rows={6}
          />

          {/* Context tags */}
          <div className="task-detail-contexts">
            {taskTags.map((tag) => (
              <button
                key={tag}
                className="context-tag selected"
                onClick={() => removeTagFromTask(task.id, tag)}
              >
                {tag}
              </button>
            ))}
            {availableTags
              .filter((tag) => !taskTags.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  className="context-tag"
                  onClick={() => addTagToTask(task.id, tag)}
                >
                  {tag}
                </button>
              ))}
          </div>

          {/* Status indicator for waiting tasks */}
          {currentStatus === 'waiting' && (
            <div className="task-detail-waiting-badge">
              Waiting for: {task.waitingFor || 'something'}
              <button onClick={handleActivate}>Make Active</button>
            </div>
          )}
        </div>

        {/* Bottom metadata section - collapsed by default */}
        <div className="task-detail-metadata">
          <button
            className="metadata-toggle"
            onClick={() => setShowMetadata(!showMetadata)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              {showMetadata ? (
                <path d="M4 10l4-4 4 4" />
              ) : (
                <path d="M4 6l4 4 4-4" />
              )}
            </svg>
            {showMetadata ? 'Hide details' : 'Show details'}
          </button>

          {showMetadata && (
            <div className="metadata-fields">
              <div className="metadata-row">
                <label>Project</label>
                <select
                  value={task.projectId || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="metadata-row">
                <label>Area</label>
                <select
                  value={task.areaId || ''}
                  onChange={(e) => handleAreaChange(e.target.value)}
                >
                  <option value="">No area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="metadata-row">
                <label>Deadline</label>
                <div className="deadline-input-row">
                  <input
                    type="date"
                    value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const date = new Date(year, month - 1, day, 23, 59, 59);
                        setDueDate(task.id, date.getTime());
                      } else {
                        setDueDate(task.id, undefined);
                      }
                    }}
                  />
                  {task.dueDate && (
                    <button
                      className="clear-deadline"
                      onClick={() => setDueDate(task.id, undefined)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {currentStatus === 'active' && (
                <div className="metadata-row">
                  <label>Actions</label>
                  <div className="action-buttons">
                    <button
                      className="action-btn waiting"
                      onClick={() => setShowWaitingPrompt(true)}
                    >
                      Waiting For...
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Waiting prompt */}
          {showWaitingPrompt && (
            <div className="waiting-prompt-inline">
              <input
                type="text"
                value={waitingFor}
                onChange={(e) => setWaitingFor(e.target.value)}
                placeholder="What are you waiting for?"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMoveToWaiting();
                  if (e.key === 'Escape') setShowWaitingPrompt(false);
                }}
              />
              <button onClick={handleMoveToWaiting} disabled={!waitingFor.trim()}>
                Confirm
              </button>
              <button onClick={() => setShowWaitingPrompt(false)}>
                Cancel
              </button>
            </div>
          )}

          {/* Delete - tucked away at bottom */}
          <button className="delete-task-btn" onClick={handleDelete}>
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
