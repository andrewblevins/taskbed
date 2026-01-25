import { useState, forwardRef, useEffect, useImperativeHandle, useRef, useMemo } from 'react';
import { useStore } from '../store';

export const TaskInput = forwardRef<HTMLInputElement>(function TaskInput(_props, ref) {
  const [title, setTitle] = useState('');
  const addTask = useStore((s) => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect Mac for keyboard shortcut hint
  const isMac = useMemo(() =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    []
  );
  const shortcutHint = isMac ? '(Cmd+N)' : '(Ctrl+N)';

  // Expose the input ref to parent
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Auto-focus on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready after any auth/loading states
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-input">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Add a task... ${shortcutHint}`}
      />
    </form>
  );
});
