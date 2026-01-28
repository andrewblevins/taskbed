import { useState } from 'react';
import { useStore } from '../store';
import { ConvertSomedayModal } from './ConvertSomedayModal';
import type { SomedayItem } from '../types';

export function SomedayView() {
  const somedayItems = useStore((s) => s.somedayItems);
  const addSomedayItem = useStore((s) => s.addSomedayItem);
  const deleteSomedayItem = useStore((s) => s.deleteSomedayItem);

  const [newItemText, setNewItemText] = useState('');
  const [convertingItem, setConvertingItem] = useState<SomedayItem | null>(null);
  const [convertMode, setConvertMode] = useState<'task' | 'project'>('task');

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addSomedayItem(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleConvertToTask = (item: SomedayItem) => {
    setConvertingItem(item);
    setConvertMode('task');
  };

  const handleConvertToProject = (item: SomedayItem) => {
    setConvertingItem(item);
    setConvertMode('project');
  };

  return (
    <>
      <header className="content-header">
        <h2>Someday / Maybe</h2>
      </header>
      <main className="content-body">
        <div className="someday-view">
          <div className="someday-add">
            <input
              type="text"
              className="someday-add-input"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="+ Add something to someday..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
            />
          </div>

          {somedayItems.length === 0 ? (
            <div className="someday-empty">
              <p>Nothing here yet.</p>
              <p className="someday-empty-hint">
                Add ideas, projects, or tasks you're not ready to commit to yet.
              </p>
            </div>
          ) : (
            <div className="someday-list">
              {somedayItems.map((item) => (
                <div key={item.id} className="someday-item">
                  <div className="someday-item-content">
                    <span className="someday-item-title">{item.title}</span>
                    {item.notes && (
                      <span className="someday-item-notes">{item.notes}</span>
                    )}
                  </div>
                  <div className="someday-item-actions">
                    <button
                      className="someday-action-btn task"
                      onClick={() => handleConvertToTask(item)}
                      title="Convert to task"
                    >
                      → Task
                    </button>
                    <button
                      className="someday-action-btn project"
                      onClick={() => handleConvertToProject(item)}
                      title="Convert to project"
                    >
                      → Project
                    </button>
                    <button
                      className="someday-action-btn delete"
                      onClick={() => deleteSomedayItem(item.id)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {convertingItem && (
        <ConvertSomedayModal
          item={convertingItem}
          mode={convertMode}
          onClose={() => setConvertingItem(null)}
        />
      )}
    </>
  );
}
