import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Task } from '../types';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { updateTask, deleteTask, projects, attributes } = useStore();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');

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
