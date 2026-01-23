import { useState } from 'react';
import { TaskInput } from './components/TaskInput';
import { GroupedTaskList } from './components/GroupedTaskList';
import { GroupingSelector } from './components/GroupingSelector';
import { TaskDetail } from './components/TaskDetail';
import { ProjectManager } from './components/ProjectManager';
import { useStore } from './store';
import type { Task } from './types';
import './App.css';

function App() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const tasks = useStore((s) => s.tasks);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Taskbed</h1>
        <div className="header-controls">
          <ProjectManager />
          <GroupingSelector />
        </div>
      </header>
      <main className="app-main">
        <TaskInput />
        <GroupedTaskList onSelectTask={(task: Task) => setSelectedTaskId(task.id)} />
      </main>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

export default App;
