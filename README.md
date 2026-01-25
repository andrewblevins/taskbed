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

## AI Integration (MCP Server)

Taskbed includes an MCP server that lets Claude Desktop and Claude Code manage tasks via natural language.

### Setup

Build the MCP server:
```bash
cd mcp-server
npm install
npm run build
```

Add to Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "taskbed": {
      "command": "node",
      "args": ["/path/to/taskbed/mcp-server/dist/index.js"]
    }
  }
}
```

Or add to Claude Code:
```bash
claude mcp add taskbed node /path/to/taskbed/mcp-server/dist/index.js
```

### Usage Examples

- "Add a task to call the dentist, tag it @phone, due Tuesday"
- "Show me my inbox"
- "What's overdue?"
- "Move that task to waiting for John"
- "Show next actions for @computer context"

See `mcp-server/README.md` for full tool documentation.

## Deployment (Netlify + Supabase)

Taskbed can be deployed to Netlify with Supabase for cloud storage, enabling mobile/cross-device access.

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema in `scripts/supabase-schema.sql`
3. Go to Project Settings > API to get your URL and keys

### 2. Configure Environment Variables

For local development, create `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

For the MCP server, create `mcp-server/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
```

### 3. Migrate Existing Data

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key
npm run migrate:supabase
```

### 4. Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy (Vercel auto-detects Vite settings)

The app will:
- Use localStorage for fast local access
- Sync to Supabase for cloud backup and cross-device sync
- Subscribe to real-time updates for instant sync between devices

## Tech Stack

- React 19 + TypeScript
- Zustand (state management with localStorage + Supabase persist)
- Supabase (PostgreSQL database + real-time sync)
- Vite
- Netlify (hosting)
