import { useState } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';

interface ProjectCompletionDialogProps {
  project: Project;
  onClose: () => void;
}

export function ProjectCompletionDialog({ project, onClose }: ProjectCompletionDialogProps) {
  const tasks = useStore((s) => s.tasks);
  const completeProject = useStore((s) => s.completeProject);
  const cancelProject = useStore((s) => s.cancelProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const incompleteTasks = tasks.filter(
    (t) => t.projectId === project.id && !t.completed
  );

  const handleComplete = () => {
    completeProject(project.id);
    onClose();
  };

  const handleCancel = () => {
    cancelProject(project.id);
    onClose();
  };

  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog project-completion-dialog" onClick={(e) => e.stopPropagation()}>
          <h3>Delete Project?</h3>
          <p className="dialog-project-name">{project.name}</p>

          <div className="dialog-warning">
            <p>This will permanently delete this project.</p>
            {incompleteTasks.length > 0 && (
              <p className="dialog-warning-note">
                {incompleteTasks.length} task{incompleteTasks.length === 1 ? '' : 's'} will be unassigned but not deleted.
              </p>
            )}
          </div>

          <div className="dialog-actions">
            <button className="dialog-btn delete-confirm" onClick={handleDelete}>
              <span className="btn-icon">&#128465;</span>
              <div className="btn-content">
                <span className="btn-label">Delete</span>
                <span className="btn-hint">Permanently remove project</span>
              </div>
            </button>
          </div>

          <button className="dialog-close-btn" onClick={() => setShowDeleteConfirm(false)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog project-completion-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Close Project</h3>
        <p className="dialog-project-name">{project.name}</p>

        {incompleteTasks.length > 0 && (
          <div className="dialog-warning">
            <p>
              This project has <strong>{incompleteTasks.length}</strong> incomplete task{incompleteTasks.length === 1 ? '' : 's'}.
            </p>
            <p className="dialog-warning-note">
              Tasks will remain in your list but won't be assigned to this project.
            </p>
          </div>
        )}

        <p className="dialog-prompt">How would you like to close this project?</p>

        <div className="dialog-actions">
          <button className="dialog-btn complete" onClick={handleComplete}>
            <span className="btn-icon">&#10003;</span>
            <div className="btn-content">
              <span className="btn-label">Complete</span>
              <span className="btn-hint">Project finished successfully</span>
            </div>
          </button>

          <button className="dialog-btn cancel-project" onClick={handleCancel}>
            <span className="btn-icon">&#10005;</span>
            <div className="btn-content">
              <span className="btn-label">Cancel</span>
              <span className="btn-hint">Abandoned or no longer needed</span>
            </div>
          </button>
        </div>

        <div className="dialog-footer-actions">
          <button className="dialog-delete-link" onClick={() => setShowDeleteConfirm(true)}>
            Delete project
          </button>
          <button className="dialog-close-btn" onClick={onClose}>
            Keep Active
          </button>
        </div>
      </div>
    </div>
  );
}
