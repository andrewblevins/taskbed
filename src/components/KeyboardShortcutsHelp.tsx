import { useEffect, useMemo } from 'react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    []
  );

  const mod = isMac ? '⌘' : 'Ctrl';

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { category: 'General', items: [
      { keys: [`${mod}+N`], description: 'New task' },
      { keys: [`${mod}+K`, '/'], description: 'Search tasks' },
      { keys: [`${mod}+Z`], description: 'Undo' },
      { keys: [`${mod}+Shift+Z`], description: 'Redo' },
      { keys: ['Esc'], description: 'Close panel / Clear search' },
      { keys: ['?'], description: 'Show this help' },
    ]},
    { category: 'Task Navigation', items: [
      { keys: ['J', '↓'], description: 'Move down' },
      { keys: ['K', '↑'], description: 'Move up' },
      { keys: ['Enter'], description: 'Open task details' },
      { keys: ['Space'], description: 'Complete/uncomplete task' },
    ]},
  ];

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="shortcuts-close" onClick={onClose}>×</button>
        </div>
        <div className="shortcuts-content">
          {shortcuts.map((section) => (
            <div key={section.category} className="shortcuts-section">
              <h3>{section.category}</h3>
              <div className="shortcuts-list">
                {section.items.map((item, i) => (
                  <div key={i} className="shortcut-row">
                    <div className="shortcut-keys">
                      {item.keys.map((key, j) => (
                        <span key={j}>
                          <kbd>{key}</kbd>
                          {j < item.keys.length - 1 && <span className="key-or">or</span>}
                        </span>
                      ))}
                    </div>
                    <span className="shortcut-description">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
