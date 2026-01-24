# Taskbed MCP Server

An MCP (Model Context Protocol) server for managing Taskbed tasks with GTD methodology. Works with Claude Desktop, Claude Code, and other MCP-compatible AI assistants.

This is part of the [Taskbed](https://github.com/andrewblevins/taskbed) project—a GTD-style task manager that treats context lists as first-class citizens.

## Features

- **Task Management**: Create, update, complete, and delete tasks
- **GTD Workflow**: Inbox, Next Actions, Waiting For, Someday/Maybe lists
- **Projects & Tags**: Organize tasks by project and context (@phone, @computer, etc.)
- **Due Dates**: Track deadlines with overdue/due-soon filtering

## Installation

```bash
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Claude Code

```bash
claude mcp add taskbed node /path/to/taskbed/mcp-server/dist/index.js
```

## Usage Examples

Once configured, you can talk to Claude naturally:

- "Add a task to call the dentist, tag it @phone, due next Tuesday"
- "Show me my inbox"
- "What's overdue?"
- "Move that task to waiting for John"
- "Show next actions for @computer context"
- "Defer this to someday"

## Tools

### Task CRUD
- `list_tasks` - List tasks with filters (status, project, tag, completed, due date)
- `get_task` - Get task details by ID
- `add_task` - Create a new task
- `update_task` - Update task properties
- `complete_task` - Mark task complete
- `uncomplete_task` - Mark task incomplete
- `delete_task` - Delete a task

### GTD Status
- `defer_to_someday` - Move task to Someday/Maybe
- `move_to_waiting` - Move task to Waiting For (specify who)
- `activate_task` - Move task back to Active

### Projects
- `list_projects` - List all projects with task counts
- `add_project` - Create a new project
- `delete_project` - Delete a project

### Tags
- `list_tags` - List available context tags
- `add_tag` - Add a new context tag

### GTD Views
- `get_inbox` - Unprocessed tasks (no project)
- `get_next_actions` - Active tasks, optionally by context
- `get_waiting_for` - Tasks waiting on others
- `get_someday` - Someday/Maybe list
- `get_due_soon` - Tasks due within N days
- `get_overdue` - Overdue tasks

## Data Storage

Tasks are stored in `../data/taskbed.json` (relative to the MCP server). This allows the MCP server to share data with the Taskbed web app.

## License

MIT
