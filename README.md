# Taskbed

A GTD-style task manager that treats context lists as first-class citizens.

## Why Taskbed?

Most task apps (Things, Todoist, etc.) bury tasks inside projects. To find what to do next, you scan through every project looking for actionable items. This breaks GTD's core workflow: context-based next action lists.

In orthodox GTD, you look at @phone and see *everything* you can do with a phone right now—regardless of which project it belongs to. Projects are just metadata, not containers.

Taskbed does this. Tasks live in flat lists filtered by context (@phone, @computer, @errands). Projects are attributes you can attach, not buckets that hide your work.

## Features

- **Context tags** - Filter by @phone, @computer, @errands, @home, @anywhere, @ai
- **Projects as metadata** - Assign projects to tasks without nesting
- **GTD status** - Active, Waiting For (with who/duration tracking), Someday/Maybe
- **Due dates** - With overdue highlighting
- **Energy levels** - High/Medium/Low for matching tasks to your state
- **Areas** - Group projects by life area (Work, Home, etc.)
- **Weekly Review** - Built-in review workflow
- **Keyboard shortcuts** - Quick capture, navigation, completion

## Getting Started

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Data

Tasks are stored in `data/taskbed.json`. The app also persists to localStorage for fast startup.

## AI Integration

There's a companion MCP server that lets Claude Desktop and Claude Code manage tasks via natural language:

- [taskbed-mcp](https://github.com/andrewblevins/taskbed-mcp)

Example: "Add a task to call the dentist, tag it @phone, due Tuesday"

## Tech Stack

- React 19 + TypeScript
- Zustand (state management with localStorage persist)
- Vite
