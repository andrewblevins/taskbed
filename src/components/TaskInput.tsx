import { useState } from 'react';
import { useStore } from '../store';

export function TaskInput() {
  const [title, setTitle] = useState('');
  const addTask = useStore((s) => s.addTask);

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
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        autoFocus
      />
    </form>
  );
}
