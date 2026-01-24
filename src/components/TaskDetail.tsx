import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Task } from '../types';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { updateTask, deleteTask, projects, attributes, setTaskStatus, moveToWaiting, activateTask } = useStore();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [showWaitingPrompt, setShowWaitingPrompt] = useState(false);
  const [waitingFor, setWaitingFor] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
  }, [task]);

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

  const handleAttributeChange = (attrId: string, value: string) => {
    const newAttributes = { ...task.attributes };
    if (value) {
      newAttributes[attrId] = value;
    } else {
      delete newAttributes[attrId];
    }
    updateTask(task.id, { attributes: newAttributes });
  };

  const handleProjectChange = (projectId: string) => {
    updateTask(task.id, { projectId: projectId || undefined });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleDeferToSomeday = () => {
    setTaskStatus(task.id, 'someday');
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
      <div className="task-detail" onClick={(e) => e.stopPropagation()}>
        <div className="task-detail-header">
          <input
            type="text"
            className="task-detail-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="Task title"
          />
          <button className="task-detail-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="task-detail-body">
          <div className="task-detail-field">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              rows={3}
            />
          </div>

          <div className="task-detail-field">
            <label>Project</label>
            <select
              value={task.projectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {attributes.map((attr) => (
            <div key={attr.id} className="task-detail-field">
              <label>{attr.name}</label>
              <div className="attribute-options">
                <button
                  className={`attribute-option ${!task.attributes[attr.id] ? 'selected' : ''}`}
                  onClick={() => handleAttributeChange(attr.id, '')}
                >
                  None
                </button>
                {attr.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`attribute-option ${task.attributes[attr.id] === opt.id ? 'selected' : ''}`}
                    style={{
                      '--option-color': opt.color,
                    } as React.CSSProperties}
                    onClick={() => handleAttributeChange(attr.id, opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Status Section */}
          <div className="task-detail-field">
            <label>Status</label>
            <div className="task-status-section">
              <span className={`status-badge status-${currentStatus}`}>
                {currentStatus === 'active' && 'Active'}
                {currentStatus === 'someday' && 'Someday / Maybe'}
                {currentStatus === 'waiting' && `Waiting for ${task.waitingFor || 'someone'}`}
              </span>

              {currentStatus !== 'active' && (
                <button className="status-action-inline activate" onClick={handleActivate}>
                  Move to Active
                </button>
              )}
            </div>
          </div>

          {/* Status Actions */}
          {currentStatus === 'active' && (
            <div className="task-detail-field">
              <label>Quick Actions</label>
              <div className="task-status-actions">
                <button className="status-action-btn-large someday" onClick={handleDeferToSomeday}>
                  Defer to Someday
                </button>
                <button
                  className="status-action-btn-large waiting"
                  onClick={() => setShowWaitingPrompt(true)}
                >
                  Move to Waiting For
                </button>
              </div>
            </div>
          )}

          {/* Waiting Prompt */}
          {showWaitingPrompt && (
            <div className="waiting-prompt">
              <label>Who are you waiting for?</label>
              <div className="waiting-prompt-input">
                <input
                  type="text"
                  value={waitingFor}
                  onChange={(e) => setWaitingFor(e.target.value)}
                  placeholder="e.g., John, Client, Vendor"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMoveToWaiting();
                    if (e.key === 'Escape') setShowWaitingPrompt(false);
                  }}
                />
                <button
                  className="waiting-prompt-btn confirm"
                  onClick={handleMoveToWaiting}
                  disabled={!waitingFor.trim()}
                >
                  Confirm
                </button>
                <button
                  className="waiting-prompt-btn cancel"
                  onClick={() => {
                    setShowWaitingPrompt(false);
                    setWaitingFor('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="task-detail-footer">
          <button className="delete-button" onClick={handleDelete}>
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
