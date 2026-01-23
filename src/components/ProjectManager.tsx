import { useState } from 'react';
import { useStore } from '../store';

export function ProjectManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const { projects, addProject, deleteProject } = useStore();

  const handleAdd = () => {
    if (newName.trim()) {
      addProject(newName.trim());
      setNewName('');
    }
  };

  if (!isOpen) {
    return (
      <button className="projects-toggle" onClick={() => setIsOpen(true)}>
        Projects ({projects.length})
      </button>
    );
  }

  return (
    <div className="projects-dropdown">
      <div className="projects-header">
        <span>Projects</span>
        <button className="projects-close" onClick={() => setIsOpen(false)}>×</button>
      </div>
      <div className="projects-list">
        {projects.map((p) => (
          <div key={p.id} className="project-item">
            <span>{p.name}</span>
            <button
              className="project-delete"
              onClick={() => deleteProject(p.id)}
            >
              ×
            </button>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="projects-empty">No projects yet</div>
        )}
      </div>
      <div className="projects-add">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New project..."
        />
        <button onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
}
