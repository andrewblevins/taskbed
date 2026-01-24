# Plan: Taskbed MCP Server

## Summary
Build an MCP (Model Context Protocol) server that exposes Taskbed's task management functionality to Claude Desktop and other MCP clients. The server will read/write directly to the same data file used by the web app, enabling AI assistants to manage tasks through natural language.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│  MCP Server     │────▶│  taskbed.json   │
│  (MCP Client)   │◀────│  (stdio)        │◀────│  (shared data)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        ▲
                                                        │
                                                ┌───────┴───────┐
                                                │  Taskbed Web  │
                                                │  (browser)    │
                                                └───────────────┘
```

**Key insight**: The MCP server reads/writes the same `data/taskbed.json` file that the web app uses. No API needed - direct file access. Changes from either side are immediately visible to the other.

## Transport Choice
**stdio** - Claude Desktop spawns the MCP server as a child process and communicates via stdin/stdout. This is the standard for local MCP servers.

## Tools to Implement

### Task Management
| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tasks` | List tasks with optional filters | `status?`, `project?`, `tag?`, `completed?`, `has_due_date?`, `overdue?` |
| `get_task` | Get a single task by ID | `id` |
| `add_task` | Create a new task | `title`, `notes?`, `project?`, `tags?`, `status?`, `due_date?`, `energy?` |
| `update_task` | Update task properties | `id`, `title?`, `notes?`, `project?`, `tags?`, `status?`, `due_date?`, `energy?`, `waiting_for?` |
| `complete_task` | Mark task as complete | `id` |
| `uncomplete_task` | Mark task as incomplete | `id` |
| `delete_task` | Delete a task | `id` |

### GTD Status Actions
| Tool | Description | Parameters |
|------|-------------|------------|
| `defer_to_someday` | Move task to Someday/Maybe | `id` |
| `move_to_waiting` | Move task to Waiting For | `id`, `waiting_for` |
| `activate_task` | Move task back to Active | `id` |

### Project Management
| Tool | Description | Parameters |
|------|-------------|------------|
| `list_projects` | List all projects | (none) |
| `add_project` | Create a new project | `name`, `color?` |
| `delete_project` | Delete a project | `id` |

### Context/Tag Management
| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tags` | List available context tags | (none) |
| `add_tag` | Add a new context tag | `tag` |

### GTD Views
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_inbox` | Get tasks with no project (unprocessed) | (none) |
| `get_next_actions` | Get active tasks, optionally by context | `tag?` |
| `get_waiting_for` | Get all waiting tasks | (none) |
| `get_someday` | Get all someday/maybe tasks | (none) |
| `get_due_soon` | Get tasks due within N days | `days?` (default: 7) |
| `get_overdue` | Get all overdue tasks | (none) |

## File Structure

```
taskbed/
├── mcp-server/
│   ├── package.json          # MCP server package
│   ├── tsconfig.json         # TypeScript config
│   ├── src/
│   │   ├── index.ts          # Entry point, MCP server setup
│   │   ├── tools/
│   │   │   ├── tasks.ts      # Task CRUD tools
│   │   │   ├── projects.ts   # Project tools
│   │   │   ├── tags.ts       # Tag tools
│   │   │   └── gtd-views.ts  # GTD-specific views
│   │   ├── data.ts           # Read/write taskbed.json
│   │   └── types.ts          # Shared types (copy from main app)
│   └── dist/                 # Compiled output
├── data/
│   └── taskbed.json          # Shared data file
└── ... (existing web app)
```

## Implementation Steps

### 1. Initialize MCP Server Package
- Create `mcp-server/` directory
- Initialize package.json with dependencies:
  - `@modelcontextprotocol/sdk`
  - `zod` (for schema validation)
  - `uuid` (for ID generation)
- Set up TypeScript config
- Add build scripts

### 2. Create Data Layer (`data.ts`)
- `loadData()` - Read and parse taskbed.json
- `saveData(state)` - Write state to taskbed.json
- Handle file not existing (return empty state)
- Use same data path as main server: `../data/taskbed.json`

### 3. Copy Types (`types.ts`)
- Copy Task, Project, Area, AttributeDefinition types
- Keep in sync with main app types

### 4. Implement Task Tools (`tools/tasks.ts`)
- `list_tasks` with filtering logic
- `get_task` by ID
- `add_task` with UUID generation
- `update_task` with partial updates
- `complete_task` / `uncomplete_task`
- `delete_task`

### 5. Implement GTD Status Tools
- `defer_to_someday` - set status to 'someday'
- `move_to_waiting` - set status to 'waiting', record waitingFor and waitingSince
- `activate_task` - set status to 'active', clear waiting fields

### 6. Implement Project Tools (`tools/projects.ts`)
- `list_projects`
- `add_project`
- `delete_project` (reassign tasks to no project)

### 7. Implement Tag Tools (`tools/tags.ts`)
- `list_tags`
- `add_tag`

### 8. Implement GTD View Tools (`tools/gtd-views.ts`)
- `get_inbox` - active tasks with no project
- `get_next_actions` - active tasks, optionally filtered by tag
- `get_waiting_for` - tasks with status 'waiting'
- `get_someday` - tasks with status 'someday'
- `get_due_soon` - tasks with dueDate within N days
- `get_overdue` - tasks with dueDate in the past

### 9. Wire Up MCP Server (`index.ts`)
- Create McpServer instance
- Register all tools with schemas
- Connect via StdioServerTransport
- Add to package.json bin field

### 10. Build and Test
- Compile TypeScript
- Test with `echo '{"method":"..."}' | node dist/index.js`
- Verify file reads/writes work

### 11. Configure Claude Desktop
Add to Claude Desktop's config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "taskbed": {
      "command": "node",
      "args": ["/Users/andrew/taskbed/mcp-server/dist/index.js"]
    }
  }
}
```

### 12. Add to Claude Code
Add to global MCP config so Claude Code can also use it:
```bash
claude mcp add taskbed node /Users/andrew/taskbed/mcp-server/dist/index.js
```

## Example Interactions

After setup, you'll be able to say things like:

> "Add a task to call the dentist, tag it @phone, due next Tuesday"
> "What's on my waiting list?"
> "Show me high-energy tasks I can do @computer"
> "Move 'review proposal' to someday"
> "What tasks are overdue?"
> "Complete 'buy groceries'"
> "What's in my inbox?"

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `mcp-server/package.json` | Create |
| `mcp-server/tsconfig.json` | Create |
| `mcp-server/src/index.ts` | Create |
| `mcp-server/src/data.ts` | Create |
| `mcp-server/src/types.ts` | Create |
| `mcp-server/src/tools/tasks.ts` | Create |
| `mcp-server/src/tools/projects.ts` | Create |
| `mcp-server/src/tools/tags.ts` | Create |
| `mcp-server/src/tools/gtd-views.ts` | Create |
| `~/.claude.json` | Modify (add MCP server) |
| Claude Desktop config | Modify (add MCP server) |
