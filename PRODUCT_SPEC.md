# Taskbed Product Specification

## Document Purpose
This specification defines the ideal user journeys for Taskbed, a GTD-style task management application. Each section documents the intended experience, from initial state through completion, with focus on what the interaction *should* be rather than current implementation details.

---

# Part 1: Overall Application Journey

## 1.1 First-Time User Journey

### Entry State
- User has never used Taskbed before
- App loads with empty state or sample data
- No authentication required for local use

### Ideal Flow
1. **App Load** (0-2s)
   - Show brief loading indicator if needed
   - Display main Tasks view with empty state
   - Empty state should communicate value proposition and guide user to add first task

2. **First Task Creation**
   - Task input field is prominently visible and focused by default
   - Placeholder text guides: "Add a task... (Cmd+N)"
   - User types task and presses Enter
   - Task appears immediately in list with subtle animation
   - Input clears and remains focused for rapid entry

3. **Discovery of Features**
   - Sidebar navigation is visible and labeled
   - Hovering over UI elements reveals tooltips for keyboard shortcuts
   - First click on a task opens TaskDetail panel with discoverable options

### Exit State
- User has at least one task in the system
- User understands basic add/view/complete workflow
- User knows where to find additional features (sidebar)

---

## 1.2 Daily Use Journey (Capture & Execute)

### Entry State
- User returns to app with existing tasks
- App restores last session state (view, grouping, filters)

### Ideal Flow
1. **Quick Capture**
   - Press Cmd+N from anywhere to focus task input
   - Type task, Enter, continue working
   - New tasks appear at top of "Uncategorized" or selected group

2. **Review Active Tasks**
   - Tasks grouped by meaningful attribute (Energy, Project)
   - Due dates clearly visible with urgency indicators
   - Overdue items highlighted (red)
   - Today/Tomorrow items emphasized (amber)

3. **Work on Tasks**
   - Click task to open detail panel
   - Quick completion via checkbox (stays in list, visual change)
   - Navigate with j/k keys, complete with Enter or click

4. **End of Day**
   - View completed items (optional)
   - Close app; all state persists

### Exit State
- Tasks captured, some completed
- Progress visible in Completed view
- State saved automatically

---

## 1.3 Weekly Review Journey

### Entry State
- User clicks "Weekly Review" in sidebar
- Has accumulated tasks over the week

### Ideal Flow
1. **Brain Dump** (Step 1)
   - Large textarea for rapid thought capture
   - Each line becomes a task on submit
   - Encourages getting everything out of head

2. **Celebrate Completions** (Step 2)
   - Shows tasks completed in last 7 days
   - Positive framing: acknowledge progress
   - No actions required; motivation boost

3. **Review Active Tasks** (Step 3)
   - List of all active tasks
   - Drag to reorder by priority
   - Quick status changes available
   - Identify tasks that should move to Someday or Waiting

4. **Review Waiting For** (Step 4)
   - Shows all items waiting on others
   - Duration displayed ("waiting 5 days")
   - Options: Follow up, Mark done, Still waiting
   - Prompts to take action on stale items

5. **Review Projects** (Step 5)
   - Lists all active projects with task counts
   - Highlights projects with 0 tasks (needs next action)
   - Quick add task to project
   - Can complete/cancel projects

6. **Loose Ends** (Step 6)
   - Shows orphaned tasks (no project, no clear status)
   - Prompts to assign or delete
   - Catches items that fell through cracks

7. **Review Someday/Maybe** (Step 7)
   - Items deferred for later consideration
   - Activate tasks that are now relevant
   - Delete items no longer wanted
   - Keep list fresh and meaningful

8. **Complete Review** (Step 8)
   - Summary of actions taken
   - Encouraging message
   - Return to normal view

### Exit State
- All lists reviewed and pruned
- Next week's priorities clear
- System trusted and current

---

# Part 2: Component Specifications

## 2.1 Sidebar Navigation

### Purpose
Provide consistent access to all views and enable filtering/organization.

### Entry State
- User is in any view
- Sidebar is visible (desktop) or accessible via menu (mobile)

### Components

#### Logo/App Title
- Shows "Taskbed" with consistent branding
- Click returns to Tasks view

#### Search Box
- Placeholder: "Search tasks..."
- Keyboard shortcut: Cmd+K or /
- Searches: titles, notes, project names, waiting-for names
- Shows results dropdown with context
- Click result opens task detail
- Escape clears search

#### Primary Navigation
| Item | Badge | Description |
|------|-------|-------------|
| Tasks | - | Active task list (default view) |
| Projects | - | Project and area management |

#### Secondary Navigation
| Item | Badge | Description |
|------|-------|-------------|
| Someday | Count | Deferred items |
| Waiting For | Count | Blocked/delegated items |
| Completed | Count | Archive of done items |
| Weekly Review | - | Guided review workflow |

#### Tag Filters
- Shows all available context tags (@home, @work, etc.)
- Click tag to filter active tasks
- Active filter highlighted
- Click again to clear filter

#### Attribute Manager (Footer)
- Collapsible section
- Create/edit/delete attributes
- Manage attribute options with colors

#### User/Logout (Footer)
- Shows when authenticated
- Logout button

### Interactions
- Single click navigates to view
- Active view highlighted
- Badges update in real-time
- Mobile: sidebar slides in/out

### Exit State
- User is in selected view
- Any filter applied is reflected in content area

---

## 2.2 Task Input

### Purpose
Enable rapid task capture with minimal friction.

### Entry State
- User wants to add a new task
- Input field visible at top of Tasks view

### Visual Design
- Clean text input with subtle border
- "Add a task..." placeholder
- Add button visible but keyboard is primary

### Behavior
1. Focus via click or Cmd+N
2. Type task title
3. Press Enter to submit
4. Task created with:
   - Status: active
   - Created timestamp
   - Unique ID
   - Order: top of uncategorized group
5. Input clears, maintains focus

### Edge Cases
- Empty input: do nothing on submit
- Whitespace only: trim and reject
- Very long titles: accept (no truncation on input)

### Exit State
- New task appears in list
- Input ready for next task

---

## 2.3 Task Item

### Purpose
Display individual task with key metadata and enable quick actions.

### Entry State
- Task exists in store
- Rendered in list context

### Visual Hierarchy
1. **Checkbox** (left) - Completion toggle
2. **Title** - Primary identifier
3. **Metadata row** - Secondary info:
   - Project badge (if assigned)
   - Due date (if set, with urgency coloring)
   - Tags (if any)
4. **Delete button** (right, on hover)

### States
| State | Visual Treatment |
|-------|------------------|
| Active | Normal styling |
| Completed | Strikethrough, muted colors |
| Focused (keyboard) | Blue border/highlight |
| Overdue | Red due date |
| Due soon | Amber due date |

### Interactions
- **Click checkbox**: Toggle completion
- **Click anywhere else**: Open TaskDetail
- **Click delete (x)**: Remove task (immediate, undoable via Cmd+Z)
- **Keyboard focus + Enter**: Open TaskDetail
- **Drag handle**: Reorder within/across groups

### Exit State
- Task state updated (if toggled/deleted)
- TaskDetail open (if clicked)

---

## 2.4 Task Detail Panel

### Purpose
Full task editing with all attributes and actions.

### Entry State
- User clicked a task in list
- Panel slides in from right (overlay on mobile)

### Layout (Top to Bottom)

#### Header
- Close button (X) - top right
- Task title (editable inline)

#### Notes Section
- Multi-line textarea
- Placeholder: "Add notes..."
- Auto-saves on blur

#### Project Assignment
- Dropdown selector
- Options: All active projects + "No Project"
- Change immediately saves

#### Due Date
- Date picker input
- Clear button (X) when set
- Shows formatted date when set

#### Attributes Section
- For each attribute (e.g., Energy):
  - Label: attribute name
  - Buttons: one per option (High/Medium/Low)
  - Active option highlighted with color
  - Click to select, click again to deselect

#### Tags/Contexts Section
- List of current tags as removable chips
- "Add tag" dropdown/input
- Existing tags shown for quick selection
- Can type new tag to create

#### Status Actions
- **Move to Someday**: Defer for later
- **Move to Waiting**: Prompts for "waiting on whom"
- **Activate**: (shown if waiting/someday) Return to active

#### Footer Actions
- **Complete/Uncomplete**: Toggle completion
- **Delete**: Remove task with confirmation

### Behavior
- Click outside panel closes it
- Escape key closes panel
- All changes save immediately
- Changes undoable via Cmd+Z

### Exit State
- Panel closed
- Task updated with any changes
- Returns to list view

---

## 2.5 Grouped Task List

### Purpose
Display active tasks organized by meaningful groupings.

### Entry State
- User is in Tasks view
- Tasks exist in store

### Grouping Modes
1. **By Attribute** (default: Energy)
   - Groups: High, Medium, Low, Uncategorized
   - Each group shows colored header

2. **By Project**
   - Groups: Each project + "No Project"
   - Header shows project name

3. **None**
   - Single flat list
   - No group headers

### Visual Structure
```
[Group Header: "High Energy" - 3 tasks]
  [Task Item]
  [Task Item]
  [Task Item]

[Group Header: "Medium Energy" - 5 tasks]
  [Task Item]
  ...
```

### Drag & Drop
- Drag task within group: reorder
- Drag task to different group header: change attribute/project
- Drag task between groups: move and reorder
- Visual feedback: drop zone highlights, opacity change

### Filtering
- When tag filter active, only shows matching tasks
- Empty groups hidden when filtered

### Exit State
- Tasks displayed in selected grouping
- Any reordering/moves persisted

---

## 2.6 Projects View

### Purpose
Manage projects and areas (GTD organizational hierarchy).

### Entry State
- User clicks "Projects" in sidebar
- Has existing projects and/or areas

### Layout

#### Header
- "Projects & Areas" title
- Add project input + button
- Add area input + button

#### Areas Section
For each area:
- **Area Header** (draggable)
  - Drag handle
  - Area name (editable inline)
  - Project count badge
  - Delete button

- **Projects in Area**
  - Draggable project rows
  - Circle icon (clickable for completion dialog)
  - Project name (editable inline)
  - Task count badge

#### No Area Section
- Projects not assigned to any area
- Same UI as area projects

### Project Completion Flow
1. Click circle icon on project
2. **ProjectCompletionDialog** opens:
   - Shows project name
   - Shows incomplete task count warning
   - Options:
     - **Complete**: Mark as finished successfully
     - **Cancel**: Mark as abandoned
     - **Delete**: Remove entirely (confirmation required)
3. Action taken, dialog closes
4. Project moves to Completed view (or deleted)

### Drag & Drop
- Drag project to different area: reassign
- Drag project to reorder within area
- Drag area header to reorder areas

### Exit State
- Projects organized by areas
- Any changes persisted

---

## 2.7 Project Completion Dialog

### Purpose
Provide clear options for closing a project.

### Entry State
- User triggered completion on a project
- Modal overlay appears

### Content

#### Main View
- "Close Project" header
- Project name prominently displayed
- Warning if incomplete tasks exist
- Three action buttons:
  1. **Complete** (checkmark icon, green-ish)
     - "Project finished successfully"
  2. **Cancel** (X icon, neutral)
     - "Abandoned or no longer needed"
  3. **Delete** link at bottom
     - "Permanently remove project"

#### Delete Confirmation View
- "Delete Project?" header
- Warning: "This will permanently delete this project"
- Note about tasks being unassigned but not deleted
- Confirm Delete button
- Go Back button

### Behavior
- Click overlay closes without action
- Actions are immediate and undoable
- Completed/cancelled projects move to Completed view

### Exit State
- Dialog closed
- Project status updated (or deleted)

---

## 2.8 Someday View

### Purpose
Show deferred items for periodic review.

### Entry State
- User clicks "Someday" in sidebar
- Has tasks with status: 'someday'

### Layout
- Header: "Someday/Maybe" with count
- List of someday tasks
- Each task shows:
  - Title
  - Project (if any)
  - Created date
  - Actions: Activate, Delete

### Interactions
- **Click task**: Open TaskDetail
- **Activate button**: Change status to 'active', return to Tasks
- **Delete button**: Remove task

### Empty State
- Message: "Nothing in Someday/Maybe"
- Explanation of what this list is for

### Exit State
- Tasks reviewed
- Some activated or deleted

---

## 2.9 Waiting For View

### Purpose
Track items delegated to or dependent on others.

### Entry State
- User clicks "Waiting For" in sidebar
- Has tasks with status: 'waiting'

### Layout
- Header: "Waiting For" with count
- List sorted by waiting duration (oldest first)
- Each task shows:
  - Title
  - "Waiting on: [Person Name]"
  - Duration: "3 days" or "2 weeks overdue"
  - Actions: Done, Follow Up, Activate

### Visual Indicators
- Old items (>7 days) highlighted
- Very old items (>14 days) emphasized more strongly

### Interactions
- **Click task**: Open TaskDetail
- **Done**: Mark task complete
- **Follow Up**: Reminder to contact person (could open email/calendar)
- **Activate**: Move back to active (stopped waiting)

### Empty State
- Message: "Not waiting on anything"
- Explanation of Waiting For concept

### Exit State
- Waiting items reviewed
- Actions taken on stale items

---

## 2.10 Completed View

### Purpose
Archive and restore completed/cancelled items.

### Entry State
- User clicks "Completed" in sidebar
- Has completed tasks and/or projects

### Layout

#### Completed Projects Section
- Header: "Completed Projects"
- Each project shows:
  - Name
  - Status badge: "Completed" (green) or "Cancelled" (gray)
  - Completion date
  - Reactivate button

#### Completed Tasks Section
- Header: "Completed Tasks"
- Grouped by completion date (Today, Yesterday, This Week, Older)
- Each task shows:
  - Title
  - Completion date
  - Restore button

### Interactions
- **Click task**: Open TaskDetail (read-only or edit)
- **Restore**: Unmark completion, return to active list
- **Reactivate project**: Set status back to 'active'

### Empty State
- Message: "Nothing completed yet"
- Encouraging note about capturing and completing tasks

### Exit State
- Completed items reviewed
- Any restored items back in active lists

---

## 2.11 Weekly Review

### Purpose
Guided GTD weekly review process.

### Entry State
- User clicks "Weekly Review" in sidebar
- System enters review mode (full-screen)

### Progress Indicator
- Step number: "Step 2 of 8"
- Progress bar
- Step title

### Navigation
- "Previous" button (disabled on step 1)
- "Next" button (changes to "Finish" on step 8)
- "Exit Review" button (always available)

### Steps

#### Step 1: Brain Dump
- Large textarea
- "Get everything out of your head..."
- Submit creates tasks from each line
- Clear after submit, can add more

#### Step 2: Celebrate Completions
- Display-only list of week's completions
- Count summary
- Positive messaging
- No actions required

#### Step 3: Review Active Tasks
- Draggable list of all active tasks
- Quick complete checkbox
- Can open TaskDetail
- Status change buttons (→ Someday, → Waiting)

#### Step 4: Review Waiting For
- List with waiting duration
- Actions: Done, Follow Up, Activate
- Encourages cleaning up stale items

#### Step 5: Review Projects
- All active projects with task counts
- Highlight projects with 0 next actions
- Quick add task to project
- Complete/Cancel buttons

#### Step 6: Loose Ends
- Tasks without project or clear status
- Assign to project or delete
- Process inbox items

#### Step 7: Review Someday/Maybe
- All deferred items
- Activate relevant ones
- Delete obsolete ones
- Keep list meaningful

#### Step 8: Review Complete
- Summary message
- "Return to Tasks" button
- Congratulations/encouragement

### Behavior
- Keyboard shortcuts disabled during review
- Cannot navigate away (must exit explicitly)
- State saved at each step
- Can exit and resume later (preserves step)

### Exit State
- Review mode ended
- Returns to Tasks view
- All changes persisted

---

## 2.12 Search

### Purpose
Find tasks quickly across all data.

### Entry State
- User focuses search box (click or Cmd+K)

### Behavior
1. User types query
2. Real-time search across:
   - Task titles
   - Task notes
   - Project names
   - Waiting-for names
3. Results dropdown appears below search box
4. Shows up to 10 results
5. Each result shows:
   - Highlighted matching text
   - Task metadata (project, status indicators)
6. Click result or use arrows + Enter
7. Selected task opens in TaskDetail

### Exit State
- Search cleared
- Task selected (or dismissed)
- Returns to previous view

---

## 2.13 Attribute Manager

### Purpose
Configure custom attributes for task organization.

### Entry State
- User expands Attribute Manager in sidebar footer
- May have existing attributes

### Layout
- Collapsible section
- "Add Attribute" button
- List of existing attributes

### Per Attribute
- Attribute name (editable)
- Options list with color indicators
- Add option button
- Delete attribute button

### Per Option
- Option label (editable)
- Color picker/selector
- Delete option button

### Interactions
- Add attribute: Creates new with default options
- Add option: Adds to selected attribute
- Edit inline: Click to edit name/label
- Change color: Click color to open picker
- Delete: Confirmation for attributes, immediate for options

### Exit State
- Attributes configured
- Changes reflected in TaskDetail and GroupedTaskList

---

## 2.14 Keyboard Navigation

### Purpose
Enable efficient keyboard-driven workflow.

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| Cmd+N | Focus task input |
| Cmd+K or / | Focus search |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Escape | Close detail/clear search/blur |

### Task List Navigation (when focused)
| Shortcut | Action |
|----------|--------|
| j or ↓ | Move focus down |
| k or ↑ | Move focus up |
| Enter | Open focused task |
| Space | Toggle completion |

### Task Detail
| Shortcut | Action |
|----------|--------|
| Escape | Close panel |

### Disabled Contexts
- During Weekly Review (except Escape)
- When typing in inputs (except Cmd shortcuts)

---

# Part 3: Gap Analysis

## 3.1 Methodology
For each component, compare the ideal specification above against current implementation. Identify:
- **Bugs**: Behavior that contradicts the spec
- **Missing Features**: Spec features not implemented
- **UX Issues**: Friction points or confusing interactions
- **Design Improvements**: Polish and refinement opportunities

---

## 3.2 Gap Analysis by Component

### Task Input
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Input not auto-focused on initial load | Low |
| UX | No visual feedback on submit (task just appears) | Low |
| Missing | Placeholder could include "(Cmd+N)" hint | Low |

### Task Item
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | Recently updated, delete button added | - |

### Task Detail
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Sections could have clearer visual separation | Low |
| OK | "Move to Waiting" has proper inline input UI | - |
| OK | Status section shows current state and actions | - |

### Grouped Task List
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Empty groups visible (shows "No tasks" text) | Low |
| OK | Group headers show task counts | - |

### Projects View
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | "No Area" section only shows when it has projects | Low |
| UX | No visual distinction between areas and projects | Medium |
| OK | Circle icon now opens completion dialog | - |

### Project Completion Dialog
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | Recently implemented, complete with delete option | - |

### Someday View
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | View exists as inline component in App.tsx | - |
| OK | Shows count, has activate/delete actions | - |
| UX | No created date shown | Low |

### Waiting For View
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | View exists with duration tracking | - |
| OK | "Follow up" activates task | - |
| UX | Could email/message integration for follow-up | Low |

### Completed View
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Tasks not grouped by date period (Today, Yesterday) | Medium |
| OK | Count summary in header exists | - |
| OK | Date formatting works per-item | - |

### Weekly Review
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Exit always resets to step 0 - no "resume" option | Medium |
| OK | Final step has summary statistics | - |
| OK | Loose Ends step is clear (tasks without project) | - |

### Search
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | "No tasks found" message exists | - |
| UX | Results styling is functional but plain | Low |

### Sidebar Navigation
| Issue Type | Description | Priority |
|------------|-------------|----------|
| OK | Tag filter shows active state | - |
| Missing | No keyboard shortcut tooltips | Low |

### Keyboard Navigation
| Issue Type | Description | Priority |
|------------|-------------|----------|
| Missing | Space to complete not implemented | Medium |
| Missing | No keyboard shortcuts reference/help modal | Low |
| OK | j/k navigation, Enter to select work | - |

### Attribute Manager
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | Interface functional but dense for small screens | Low |
| UX | No confirmation on delete attribute (uses confirm()) | Low |

### Mobile Experience
| Issue Type | Description | Priority |
|------------|-------------|----------|
| UX | TaskDetail panel may overlap content | Medium |
| UX | Touch targets on task checkboxes | Medium |
| UX | Drag-and-drop harder on touch devices | Low |

---

## 3.3 Priority Actions

### Completed (Addressed)
1. ~~Add Space to complete focused task~~ - DONE
2. ~~Add date period grouping to Completed view~~ - DONE (Today/Yesterday/This Week/Older)
3. ~~Add "Resume Review" option~~ - DONE (shows Resume vs Start New when mid-review)
4. ~~Better visual distinction between areas and projects~~ - DONE (area headers uppercase, projects indented with accent border)
5. ~~Auto-focus task input on initial load~~ - DONE
6. ~~Add "(Cmd+N)" hint to task input placeholder~~ - DONE

### Remaining (Nice to Have)
1. Show created date in Someday view items

### All Key Items Completed
- Mobile TaskDetail: slide-up animation, pull handle, proper scrolling, safe area padding
- Keyboard shortcuts help: press ? to show modal with all shortcuts
- Touch targets: 44px minimum hit areas for checkboxes, buttons, and interactive elements

---

## 3.4 Summary

All priority items from the product spec have been addressed. The app now has:
- Full keyboard navigation (j/k/Enter/Space/?)
- Undo/redo support
- Mobile-optimized TaskDetail
- Touch-friendly targets
- Completed items grouped by date
- Resume review functionality
- Clear visual hierarchy

---

# Appendix: Data Model Reference

## Task
```typescript
interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  status: 'active' | 'someday' | 'waiting';
  projectId?: string;
  attributes: Record<string, string>;
  tags: string[];
  createdAt: number;
  completedAt?: number;
  order?: number;
  waitingFor?: string;
  waitingSince?: number;
  dueDate?: number;
}
```

## Project
```typescript
interface Project {
  id: string;
  name: string;
  color?: string;
  areaId?: string;
  order: number;
  createdAt: number;
  status: 'active' | 'completed' | 'cancelled';
  completedAt?: number;
}
```

## Area
```typescript
interface Area {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}
```

## Attribute
```typescript
interface AttributeDefinition {
  id: string;
  name: string;
  options: AttributeOption[];
}

interface AttributeOption {
  id: string;
  label: string;
  color?: string;
}
```
