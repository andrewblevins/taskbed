import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { Task } from '../types';

interface InboxViewProps {
  onSelectTask?: (task: Task) => void;
}

export function InboxView({ onSelectTask }: InboxViewProps) {
  const {
    addTask,
    projects,
    attributes,
    availableTags,
    addTag,
    tasks,
    toggleTask,
  } = useStore();

  const [title, setTitle] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isMac = useMemo(() =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    []
  );

  const resetForm = () => {
    setTitle('');
    setShowDetails(false);
    setProjectId('');
    setNotes('');
    setSelectedTags([]);
    setDueDate('');
    setSelectedAttributes({});
    setNewTag('');
    titleInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const options: Parameters<typeof addTask>[1] = {};
    if (projectId) options.projectId = projectId;
    if (notes.trim()) options.notes = notes.trim();
    if (selectedTags.length > 0) options.tags = selectedTags;
    if (dueDate) {
      const [year, month, day] = dueDate.split('-').map(Number);
      const date = new Date(year, month - 1, day, 23, 59, 59);
      options.dueDate = date.getTime();
    }
    if (Object.keys(selectedAttributes).length > 0) {
      options.attributes = selectedAttributes;
    }

    addTask(title.trim(), Object.keys(options).length > 0 ? options : undefined);

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);

    resetForm();
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    const tag = newTag.trim().startsWith('@') ? newTag.trim() : `@${newTag.trim()}`;
    addTag(tag);
    setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    setNewTag('');
  };

  const handleAttributeChange = (attrId: string, value: string) => {
    setSelectedAttributes(prev => {
      const next = { ...prev };
      if (value) {
        next[attrId] = value;
      } else {
        delete next[attrId];
      }
      return next;
    });
  };

  const activeProjects = projects.filter(p => p.status === 'active');

  // Inbox items: active, not completed, no project assigned
  const inboxItems = useMemo(() =>
    tasks.filter(t =>
      !t.completed &&
      (t.status === 'active' || !t.status) &&
      !t.projectId
    ).sort((a, b) => b.createdAt - a.createdAt),
    [tasks]
  );

  return (
    <>
      <header className="content-header">
        <h2>Inbox</h2>
        <span className="header-count">{inboxItems.length} items</span>
      </header>
      <main className="content-body">
        <div className="inbox-container">
          <form onSubmit={handleSubmit} className="inbox-form">
            <div className="inbox-title-section">
              <input
                ref={titleInputRef}
                type="text"
                className="inbox-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`What's on your mind?`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !showDetails) {
                    handleSubmit(e);
                  }
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            {title.trim() && (
              <button
                type="button"
                className="inbox-toggle-details"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide details' : 'Add details (project, tags, due date...)'}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  {showDetails ? (
                    <path d="M2 8L6 4L10 8" />
                  ) : (
                    <path d="M2 4L6 8L10 4" />
                  )}
                </svg>
              </button>
            )}

            {showDetails && (
              <div className="inbox-details">
                <div className="inbox-field">
                  <label>Project</label>
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">No project</option>
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="inbox-field">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="due-date-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="inbox-field">
                  <label>Context Tags</label>
                  <div className="inbox-tags">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => handleToggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="New tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewTag();
                        }
                      }}
                    />
                  </div>
                </div>

                {attributes.map((attr) => (
                  <div key={attr.id} className="inbox-field">
                    <label>{attr.name}</label>
                    <div className="attribute-options">
                      <button
                        type="button"
                        className={`attribute-option ${!selectedAttributes[attr.id] ? 'selected' : ''}`}
                        onClick={() => handleAttributeChange(attr.id, '')}
                      >
                        None
                      </button>
                      {attr.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`attribute-option ${selectedAttributes[attr.id] === opt.id ? 'selected' : ''}`}
                          style={{ '--option-color': opt.color } as React.CSSProperties}
                          onClick={() => handleAttributeChange(attr.id, opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="inbox-field">
                  <label>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="inbox-actions">
              <button
                type="submit"
                className="inbox-save-btn"
                disabled={!title.trim()}
              >
                {isMac ? 'Save (⌘↵)' : 'Save (Ctrl+↵)'}
              </button>
              {justSaved && (
                <span className="inbox-saved-indicator">Saved!</span>
              )}
            </div>
          </form>

          {inboxItems.length > 0 && (
            <div className="inbox-items">
              {inboxItems.map((task) => (
                <div
                  key={task.id}
                  className="inbox-item"
                  onClick={() => onSelectTask?.(task)}
                >
                  <button
                    className="inbox-item-checkbox"
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    aria-label="Complete task"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="9" r="7" />
                    </svg>
                  </button>
                  <span className="inbox-item-title">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
