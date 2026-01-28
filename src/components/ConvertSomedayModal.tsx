import { useState } from 'react';
import { useStore } from '../store';
import type { SomedayItem } from '../types';

const CONTEXTS = [
  { id: '@deep', label: '@deep', description: 'Focused, uninterrupted' },
  { id: '@shallow', label: '@shallow', description: 'Quick, interruptible' },
  { id: '@calls', label: '@calls', description: 'Need to talk' },
  { id: '@out', label: '@out', description: 'Away from home/office' },
  { id: '@offline', label: '@offline', description: 'No internet needed' },
];

interface ConvertSomedayModalProps {
  item: SomedayItem;
  mode: 'task' | 'project';
  onClose: () => void;
}

export function ConvertSomedayModal({ item, mode, onClose }: ConvertSomedayModalProps) {
  const convertSomedayToTask = useStore((s) => s.convertSomedayToTask);
  const convertSomedayToProject = useStore((s) => s.convertSomedayToProject);

  const [selectedContext, setSelectedContext] = useState('@shallow');
  const [projectName, setProjectName] = useState(item.title);
  const [firstAction, setFirstAction] = useState('');

  const handleConvertToTask = () => {
    convertSomedayToTask(item.id, selectedContext);
    onClose();
  };

  const handleConvertToProject = () => {
    if (projectName.trim() && firstAction.trim()) {
      convertSomedayToProject(item.id, projectName.trim(), firstAction.trim(), selectedContext);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content convert-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{mode === 'task' ? 'Convert to Task' : 'Convert to Project'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <div className="modal-body">
          {mode === 'task' ? (
            <>
              <p className="convert-item-title">"{item.title}"</p>

              <label className="convert-label">What context?</label>
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

              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="modal-btn primary" onClick={handleConvertToTask}>
                  Create Task
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="convert-label">Project name</label>
              <input
                type="text"
                className="convert-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />

              <label className="convert-label">First next action</label>
              <input
                type="text"
                className="convert-input"
                value={firstAction}
                onChange={(e) => setFirstAction(e.target.value)}
                placeholder="What's the very next physical action?"
              />

              <label className="convert-label">Context for first action</label>
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

              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleConvertToProject}
                  disabled={!projectName.trim() || !firstAction.trim()}
                >
                  Create Project
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
