# Taskbed Feature Implementation Plans

## Overview

Four features to implement, all aligned with GTD methodology:
1. **Due Dates** - GTD's tickler file / calendar integration
2. **Tags** - GTD's contexts (@phone, @errands, @computer)
3. **Search** - Quick access to any task
4. **Keyboard Shortcuts** - Efficient GTD processing

---

## Feature 1: Due Dates (GTD Tickler File)

### GTD Context
In GTD, the "tickler file" holds items that need attention on a specific future date. Due dates in Taskbed serve this purpose - surfacing tasks when they become time-relevant. Important: due dates are **optional** and most tasks shouldn't have them. GTD emphasizes context over deadlines.

### Data Model Changes

**types/index.ts:**
```typescript
export interface Task {
  // ... existing fields
  dueDate?: number;        // Unix timestamp, optional
  dueTime?: string;        // Optional time "HH:MM" format (null = all day)
}
```

### Store Changes

**store/index.ts:**
```typescript
// New action
setTaskDueDate: (id: string, dueDate: number | undefined, dueTime?: string) => void;

// Implementation
setTaskDueDate: (id, dueDate, dueTime) =>
  set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, dueDate, dueTime } : t
    ),
  })),
```

### UI Changes

**TaskDetail.tsx - Add date picker field:**
```tsx
<div className="task-detail-field">
  <label>Due Date</label>
  <div className="due-date-picker">
    <input
      type="date"
      value={task.dueDate ? formatDateForInput(task.dueDate) : ''}
      onChange={(e) => handleDueDateChange(e.target.value)}
    />
    {task.dueDate && (
      <>
        <input
          type="time"
          value={task.dueTime || ''}
          onChange={(e) => handleDueTimeChange(e.target.value)}
          placeholder="All day"
        />
        <button onClick={clearDueDate}>Clear</button>
      </>
    )}
  </div>
  {/* Quick date buttons */}
  <div className="quick-dates">
    <button onClick={() => setDueDate('today')}>Today</button>
    <button onClick={() => setDueDate('tomorrow')}>Tomorrow</button>
    <button onClick={() => setDueDate('nextWeek')}>Next Week</button>
  </div>
</div>
```

**TaskItem.tsx - Show due date badge:**
```tsx
{task.dueDate && (
  <span className={`due-badge ${getDueStatus(task.dueDate)}`}>
    {formatDueDate(task.dueDate)}
  </span>
)}
```

Due status classes:
- `due-overdue` - Past due (red)
- `due-today` - Due today (orange)
- `due-soon` - Due within 3 days (yellow)
- `due-future` - Future (gray)

**GroupedTaskList.tsx - Add due date grouping option:**
```typescript
// In ViewGrouping type
| { type: 'dueDate' }

// Grouping logic
if (currentGrouping.type === 'dueDate') {
  const groups = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDue: [],
  };
  // Sort tasks into groups based on due date
}
```

**App.tsx - Optional "Today" view in sidebar:**
```tsx
<button
  className={`nav-item ${currentView === 'today' ? 'active' : ''}`}
  onClick={() => setCurrentView('today')}
>
  Today
  <TodayCount />
</button>
```

### Helper Functions

```typescript
// utils/dates.ts
export function getDueStatus(dueDate: number): 'overdue' | 'today' | 'soon' | 'future' {
  const now = new Date();
  const due = new Date(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'future';
}

export function formatDueDate(dueDate: number): string {
  const status = getDueStatus(dueDate);
  if (status === 'today') return 'Today';
  if (status === 'overdue') {
    const days = Math.abs(/* diff */);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  // ... format as "Mon, Jan 15" or "Tomorrow"
}
```

### CSS

```css
.due-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-weight: 500;
}

.due-badge.due-overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.due-badge.due-today {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.due-badge.due-soon {
  background: rgba(234, 179, 8, 0.1);
  color: #ca8a04;
}

.due-badge.due-future {
  background: var(--color-bg);
  color: var(--color-text-tertiary);
}
```

### Weekly Review Integration

Add to "Review Active Tasks" step: highlight overdue tasks with special styling and prompt to reschedule or complete.

---

## Feature 2: Tags (GTD Contexts)

### GTD Context
Contexts in GTD answer "where/how can I do this?" Common examples:
- @phone - Calls to make
- @computer - Digital tasks
- @errands - Out and about
- @home - At home tasks
- @office - At work tasks
- @agenda:Person - Discuss with someone

Tags are **separate from attributes** - they're multi-select and cross-cutting.

### Data Model Changes

**types/index.ts:**
```typescript
export interface Task {
  // ... existing fields
  tags: string[];  // Array of tag IDs
}

export interface Tag {
  id: string;
  name: string;     // Display name (e.g., "Phone")
  prefix?: string;  // Optional prefix (e.g., "@") - defaults to "@"
  color?: string;
}
```

### Store Changes

**store/index.ts:**
```typescript
interface TaskbedState {
  // ... existing
  tags: Tag[];

  // Tag management
  addTag: (name: string) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // Task tagging
  addTagToTask: (taskId: string, tagId: string) => void;
  removeTagFromTask: (taskId: string, tagId: string) => void;
  setTaskTags: (taskId: string, tagIds: string[]) => void;
}

// Default tags (GTD contexts)
tags: [
  { id: 'phone', name: 'Phone', color: '#3b82f6' },
  { id: 'computer', name: 'Computer', color: '#8b5cf6' },
  { id: 'errands', name: 'Errands', color: '#22c55e' },
  { id: 'home', name: 'Home', color: '#f59e0b' },
  { id: 'office', name: 'Office', color: '#6b7280' },
],
```

### UI Changes

**TaskDetail.tsx - Multi-select tag picker:**
```tsx
<div className="task-detail-field">
  <label>Contexts</label>
  <div className="tag-picker">
    {tags.map((tag) => (
      <button
        key={tag.id}
        className={`tag-chip ${task.tags?.includes(tag.id) ? 'selected' : ''}`}
        style={{ '--tag-color': tag.color } as React.CSSProperties}
        onClick={() => toggleTag(tag.id)}
      >
        @{tag.name}
      </button>
    ))}
  </div>
</div>
```

**TaskItem.tsx - Show tags:**
```tsx
{task.tags?.length > 0 && (
  <div className="task-tags">
    {task.tags.slice(0, 2).map((tagId) => {
      const tag = tags.find(t => t.id === tagId);
      return tag ? (
        <span key={tagId} className="tag-mini" style={{ color: tag.color }}>
          @{tag.name}
        </span>
      ) : null;
    })}
    {task.tags.length > 2 && (
      <span className="tag-more">+{task.tags.length - 2}</span>
    )}
  </div>
)}
```

**GroupingSelector.tsx - Add tag grouping:**
```typescript
// ViewGrouping type extension
| { type: 'tag', tagId: string }

// In selector
<optgroup label="By Context">
  {tags.map((tag) => (
    <option key={tag.id} value={`tag:${tag.id}`}>@{tag.name}</option>
  ))}
</optgroup>
```

**Sidebar - Tag filter view:**
```tsx
<div className="nav-divider" />
<div className="nav-section-label">Contexts</div>
{tags.map((tag) => (
  <button
    key={tag.id}
    className={`nav-item nav-tag ${currentView === `tag:${tag.id}` ? 'active' : ''}`}
    onClick={() => setCurrentView(`tag:${tag.id}`)}
  >
    <span className="tag-dot" style={{ background: tag.color }} />
    @{tag.name}
    <TagCount tagId={tag.id} />
  </button>
))}
```

**TagManager component (in sidebar footer):**
Similar to AttributeManager - collapsible panel for adding/editing/deleting tags.

### CSS

```css
.tag-chip {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tag-chip.selected {
  background: var(--tag-color);
  border-color: var(--tag-color);
  color: white;
}

.tag-mini {
  font-size: 0.6875rem;
  font-weight: 500;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

---

## Feature 3: Search

### GTD Context
Quick capture and retrieval is essential to GTD trust. If you can't find something quickly, you won't trust the system. Search provides instant access across all lists.

### Implementation

**App.tsx - Add search state and input:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [isSearching, setIsSearching] = useState(false);

// In header
<div className="search-container">
  <input
    type="text"
    className="search-input"
    placeholder="Search tasks... (⌘K)"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onFocus={() => setIsSearching(true)}
    onBlur={() => !searchQuery && setIsSearching(false)}
  />
  {searchQuery && (
    <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
  )}
</div>
```

**Search filtering logic:**
```typescript
const filteredTasks = useMemo(() => {
  if (!searchQuery.trim()) return tasks;

  const query = searchQuery.toLowerCase();
  return tasks.filter((task) => {
    // Search in title
    if (task.title.toLowerCase().includes(query)) return true;
    // Search in notes
    if (task.notes?.toLowerCase().includes(query)) return true;
    // Search in project name
    const project = projects.find(p => p.id === task.projectId);
    if (project?.name.toLowerCase().includes(query)) return true;
    // Search in tags
    const taskTags = task.tags?.map(id => tags.find(t => t.id === id)?.name).filter(Boolean);
    if (taskTags?.some(name => name?.toLowerCase().includes(query))) return true;

    return false;
  });
}, [tasks, projects, tags, searchQuery]);
```

**Search results view:**
```tsx
{isSearching && searchQuery && (
  <div className="search-results">
    <div className="search-results-header">
      {filteredTasks.length} results for "{searchQuery}"
    </div>
    <div className="search-results-list">
      {filteredTasks.map((task) => (
        <SearchResultItem
          key={task.id}
          task={task}
          query={searchQuery}
          onSelect={() => {
            setSelectedTaskId(task.id);
            setSearchQuery('');
          }}
        />
      ))}
    </div>
  </div>
)}
```

**SearchResultItem - Highlight matches:**
```tsx
function SearchResultItem({ task, query, onSelect }) {
  const highlightMatch = (text: string) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i}>{part}</mark>
        : part
    );
  };

  return (
    <div className="search-result-item" onClick={onSelect}>
      <span className="search-result-title">{highlightMatch(task.title)}</span>
      <div className="search-result-meta">
        {task.projectId && <span className="search-result-project">{projectName}</span>}
        <span className={`search-result-status status-${task.status}`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}
```

### CSS

```css
.search-container {
  position: relative;
  width: 240px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.875rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.search-input:focus {
  border-color: var(--color-accent);
  background: var(--color-surface);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 50;
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
}

.search-result-item:hover {
  background: var(--color-bg);
}

.search-result-item mark {
  background: rgba(0, 122, 255, 0.2);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}
```

---

## Feature 4: Keyboard Shortcuts

### GTD Context
Processing and organizing should be frictionless. Keyboard shortcuts enable rapid task triage during review and quick capture without context switching.

### Shortcuts to Implement

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` / `Ctrl+K` | Focus search | Global |
| `⌘N` / `Ctrl+N` | Quick add task | Global |
| `Escape` | Close modal / clear search | Global |
| `j` / `k` | Navigate task list | Task list focused |
| `Enter` | Open task detail | Task selected |
| `x` | Toggle complete | Task selected |
| `e` | Edit task | Task selected |
| `d` | Delete task | Task selected (with confirm) |
| `s` | Move to Someday | Task selected |
| `w` | Move to Waiting | Task selected |
| `p` | Assign to project | Task selected |
| `1-9` | Set energy level | Task selected |
| `?` | Show shortcuts help | Global |

### Implementation

**useKeyboardShortcuts hook:**
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts({
  onSearch,
  onAddTask,
  onNavigate,
  onSelectTask,
  selectedTaskId,
  tasks,
}: KeyboardShortcutOptions) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement).tagName
      );

      // Global shortcuts (work even in inputs with modifier)
      if (isModifier && e.key === 'k') {
        e.preventDefault();
        onSearch();
        return;
      }

      if (isModifier && e.key === 'n') {
        e.preventDefault();
        onAddTask();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // Don't process other shortcuts if in input
      if (isInInput) return;

      // Navigation shortcuts
      if (e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, tasks.length - 1));
      }

      if (e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }

      // Action shortcuts (require selection)
      if (selectedTaskId) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpenDetail(selectedTaskId);
        }
        if (e.key === 'x') {
          e.preventDefault();
          toggleTask(selectedTaskId);
        }
        // ... etc
      }

      // Help
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, tasks, /* other deps */]);

  return { selectedIndex, setSelectedIndex };
}
```

**App.tsx integration:**
```tsx
const { selectedIndex } = useKeyboardShortcuts({
  onSearch: () => searchInputRef.current?.focus(),
  onAddTask: () => taskInputRef.current?.focus(),
  // ... other handlers
});

// Pass selectedIndex to GroupedTaskList for visual highlight
<GroupedTaskList
  selectedIndex={selectedIndex}
  onSelectTask={setSelectedTaskId}
/>
```

**Visual selection indicator:**
```tsx
// In TaskItem or DraggableTask
<div className={`task-item ${isSelected ? 'keyboard-selected' : ''}`}>
```

```css
.task-item.keyboard-selected {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
```

**ShortcutsHelp modal:**
```tsx
function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="shortcuts-modal" onClick={onClose}>
      <div className="shortcuts-content" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard Shortcuts</h2>
        <div className="shortcuts-grid">
          <div className="shortcut-section">
            <h3>Navigation</h3>
            <dl>
              <dt><kbd>j</kbd> / <kbd>k</kbd></dt>
              <dd>Move down / up</dd>
              <dt><kbd>Enter</kbd></dt>
              <dd>Open task</dd>
            </dl>
          </div>
          <div className="shortcut-section">
            <h3>Actions</h3>
            <dl>
              <dt><kbd>x</kbd></dt>
              <dd>Complete task</dd>
              <dt><kbd>s</kbd></dt>
              <dd>Move to Someday</dd>
              <dt><kbd>w</kbd></dt>
              <dd>Move to Waiting</dd>
            </dl>
          </div>
          <div className="shortcut-section">
            <h3>Global</h3>
            <dl>
              <dt><kbd>⌘</kbd><kbd>K</kbd></dt>
              <dd>Search</dd>
              <dt><kbd>⌘</kbd><kbd>N</kbd></dt>
              <dd>New task</dd>
              <dt><kbd>?</kbd></dt>
              <dd>Show shortcuts</dd>
            </dl>
          </div>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

### CSS

```css
.shortcuts-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.shortcuts-content {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 600px;
  width: 90%;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: 1.5rem 0;
}

kbd {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: inherit;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 0 var(--color-border);
}
```

---

## Implementation Order

Recommended sequence:

1. **Search** - Relatively isolated, high utility
2. **Keyboard Shortcuts** - Builds on search (⌘K), improves workflow
3. **Tags** - New data model, medium complexity
4. **Due Dates** - New data model + date picker UI complexity

Each feature should be implemented, tested, and committed separately.

---

## Files to Modify (Summary)

| Feature | Types | Store | Components | CSS |
|---------|-------|-------|------------|-----|
| Due Dates | `Task.dueDate`, `Task.dueTime` | `setTaskDueDate` | TaskDetail, TaskItem, GroupedTaskList, GroupingSelector | due-badge styles |
| Tags | `Task.tags[]`, `Tag` interface | tag CRUD, task tagging | TaskDetail, TaskItem, TagManager, Sidebar | tag-chip styles |
| Search | - | - | App (search state), SearchResultItem | search styles |
| Keyboard | - | - | App (hook), ShortcutsHelp modal | keyboard-selected, kbd styles |
