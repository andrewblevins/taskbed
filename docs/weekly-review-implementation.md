# Weekly Review Mode - Implementation Spec (Minimal Version)

## What We Have Now

Current data model:
- **Tasks**: id, title, notes, completed, projectId, attributes, createdAt, completedAt
- **Projects**: id, name, areaId, order, createdAt
- **Areas**: id, name, order, createdAt

No Waiting For, no Someday/Maybe, no review tracking. This spec works with what exists.

## GTD Weekly Review Essentials

The Weekly Review has three phases. Here's what we can do with the current system:

### Phase 1: Get Clear
- Brain dump - capture what's on your mind
- Add new tasks directly to the system

### Phase 2: Get Current
- Review what you completed this week
- Review all incomplete tasks - delete or keep
- Review all projects - check each has at least one task

### Phase 3: Get Creative
- Review tasks with no project (loose ends)
- Prompt for new projects or ideas

## Implementation

### No Data Model Changes

We use only existing fields:
- `task.completed` and `task.completedAt` to find recent completions
- `task.projectId` to check project health
- `task.createdAt` to identify new items

### Store Additions

```typescript
// Minimal addition to TaskbedState - just track if review is active
reviewInProgress: boolean;
reviewStep: number; // 0-5 for the steps below

// Actions
startReview: () => void;
nextReviewStep: () => void;
exitReview: () => void;
```

### UI Flow: 6 Simple Steps

**Step 0 - Start**
- "Weekly Review" button in sidebar
- Click to enter review mode (full screen, focused)

**Step 1 - Brain Dump**
> "What's on your mind? Capture anything not yet in your system."

- Large text area
- Each line becomes a task when you hit Enter or click "Add"
- Tasks go to inbox (no project assigned)
- Button: "Done capturing" → next step

**Step 2 - Celebrate Completions**
> "Here's what you completed in the last 7 days."

- Read-only list of completed tasks (filtered by `completedAt` in last 7 days)
- Just for reflection, no actions needed
- Button: "Next" → next step

**Step 3 - Review Active Tasks**
> "Review each task. Is it still relevant? Delete what's no longer needed."

- Shows all incomplete tasks, one at a time (or in a list with quick actions)
- For each: "Keep" or "Delete"
- Can also edit the task title inline
- Button: "Done reviewing tasks" → next step

**Step 4 - Review Projects**
> "Does each project have at least one next action?"

- Shows each project with its incomplete task count
- Projects with 0 tasks are flagged: "No next action!"
- Can quick-add a task to any project
- Can delete empty/stale projects
- Button: "Done reviewing projects" → next step

**Step 5 - Loose Ends**
> "These tasks aren't assigned to any project. Assign them or leave as standalone."

- Shows tasks where `projectId` is undefined
- Can assign to a project via dropdown
- Can leave as-is (standalone tasks are fine in GTD)
- Button: "Finish Review" → completion

**Step 6 - Complete**
> "Weekly Review complete!"

Summary:
- Tasks added: X
- Tasks deleted: X
- Tasks reviewed: X
- Projects reviewed: X

Button: "Return to Tasks"

### Visual Design

- Full-screen takeover (hide sidebar during review)
- One step at a time, clear progress indicator (Step 3 of 6)
- Large, readable text
- Minimal UI - just the current step's content and navigation
- "Exit Review" option always available (confirms before exiting)

### Files to Create/Modify

- `src/store/index.ts` - add `reviewInProgress`, `reviewStep`, and 3 actions
- `src/components/WeeklyReview.tsx` - single component with step switching
- `src/App.tsx` - add Review nav item, render WeeklyReview when active
- `src/App.css` - review-specific styles

### Implementation Steps

1. Add review state to store (3 fields, 3 actions)
2. Create WeeklyReview component shell with step navigation
3. Implement each step as a section within the component
4. Add nav item and conditional rendering in App.tsx
5. Style it

This is maybe 200-300 lines of new code total.

## Future Enhancements (Not Now)

These would require data model changes:
- Waiting For tracking
- Someday/Maybe list
- Review history (when did you last review?)
- Per-task "last reviewed" timestamp
