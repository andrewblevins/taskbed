#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import {
  listTasks,
  getTask,
  addTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
} from './tools/tasks.js';
import { deferToSomeday, moveToWaiting, activateTask } from './tools/gtd-status.js';
import { listProjects, addProject, deleteProject } from './tools/projects.js';
import { listTags, addTag } from './tools/tags.js';
import {
  getInbox,
  getNextActions,
  getWaitingFor,
  getSomeday,
  getDueSoon,
  getOverdue,
} from './tools/gtd-views.js';

// Create server
const server = new Server(
  {
    name: 'taskbed-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools
const TOOLS = [
  // Task CRUD
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters. Returns active incomplete tasks by default.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'someday', 'waiting'],
          description: 'Filter by task status',
        },
        project: {
          type: 'string',
          description: 'Filter by project name or ID',
        },
        tag: {
          type: 'string',
          description: 'Filter by context tag (e.g., "@phone" or "phone")',
        },
        completed: {
          type: 'boolean',
          description: 'Filter by completion status',
        },
        has_due_date: {
          type: 'boolean',
          description: 'Only show tasks with due dates',
        },
        overdue: {
          type: 'boolean',
          description: 'Only show overdue tasks',
        },
      },
    },
  },
  {
    name: 'get_task',
    description: 'Get detailed information about a specific task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_task',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        notes: { type: 'string', description: 'Optional notes' },
        project: { type: 'string', description: 'Project name or ID' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags (e.g., ["@phone", "@computer"])',
        },
        status: {
          type: 'string',
          enum: ['active', 'someday', 'waiting'],
          description: 'Task status (default: active)',
        },
        due_date: {
          type: 'string',
          description: 'Due date (e.g., "2024-01-15" or "tomorrow")',
        },
        energy: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Energy level required',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'New title' },
        notes: { type: 'string', description: 'New notes (empty string to clear)' },
        project: { type: 'string', description: 'New project (empty string to remove)' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (replaces existing)',
        },
        status: {
          type: 'string',
          enum: ['active', 'someday', 'waiting'],
          description: 'New status',
        },
        due_date: { type: 'string', description: 'New due date (empty string to clear)' },
        energy: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'New energy level',
        },
        waiting_for: { type: 'string', description: 'Who you are waiting for' },
      },
      required: ['id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as complete',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'uncomplete_task',
    description: 'Mark a completed task as incomplete',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },

  // GTD Status Actions
  {
    name: 'defer_to_someday',
    description: 'Move a task to Someday/Maybe list (for ideas not ready to commit to)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'move_to_waiting',
    description: 'Move a task to Waiting For list (when blocked on someone)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        waiting_for: { type: 'string', description: 'Who you are waiting for' },
      },
      required: ['id', 'waiting_for'],
    },
  },
  {
    name: 'activate_task',
    description: 'Move a task back to Active status',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },

  // Project Management
  {
    name: 'list_projects',
    description: 'List all projects with task counts',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        color: { type: 'string', description: 'Optional color (hex, e.g., "#ff6b6b")' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project (tasks will be moved to no project)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID or name' },
      },
      required: ['id'],
    },
  },

  // Tag Management
  {
    name: 'list_tags',
    description: 'List available context tags (GTD contexts)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_tag',
    description: 'Add a new context tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Tag name (@ prefix optional)' },
      },
      required: ['tag'],
    },
  },

  // GTD Views
  {
    name: 'get_inbox',
    description: 'Get inbox (active tasks with no project - unprocessed items)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_next_actions',
    description: 'Get next actions (active tasks), optionally filtered by context',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Filter by context tag' },
      },
    },
  },
  {
    name: 'get_waiting_for',
    description: 'Get all tasks you are waiting on others for',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_someday',
    description: 'Get Someday/Maybe list',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_due_soon',
    description: 'Get tasks due within a specified number of days',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days (default: 7)' },
      },
    },
  },
  {
    name: 'get_overdue',
    description: 'Get all overdue tasks',
    inputSchema: { type: 'object', properties: {} },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      // Task CRUD
      case 'list_tasks':
        result = listTasks(args as Parameters<typeof listTasks>[0]);
        break;
      case 'get_task':
        result = getTask((args as { id: string }).id);
        break;
      case 'add_task':
        result = addTask(args as Parameters<typeof addTask>[0]);
        break;
      case 'update_task':
        result = updateTask(args as Parameters<typeof updateTask>[0]);
        break;
      case 'complete_task':
        result = completeTask((args as { id: string }).id);
        break;
      case 'uncomplete_task':
        result = uncompleteTask((args as { id: string }).id);
        break;
      case 'delete_task':
        result = deleteTask((args as { id: string }).id);
        break;

      // GTD Status
      case 'defer_to_someday':
        result = deferToSomeday((args as { id: string }).id);
        break;
      case 'move_to_waiting':
        result = moveToWaiting(
          (args as { id: string; waiting_for: string }).id,
          (args as { id: string; waiting_for: string }).waiting_for
        );
        break;
      case 'activate_task':
        result = activateTask((args as { id: string }).id);
        break;

      // Projects
      case 'list_projects':
        result = listProjects();
        break;
      case 'add_project':
        result = addProject(
          (args as { name: string; color?: string }).name,
          (args as { name: string; color?: string }).color
        );
        break;
      case 'delete_project':
        result = deleteProject((args as { id: string }).id);
        break;

      // Tags
      case 'list_tags':
        result = listTags();
        break;
      case 'add_tag':
        result = addTag((args as { tag: string }).tag);
        break;

      // GTD Views
      case 'get_inbox':
        result = getInbox();
        break;
      case 'get_next_actions':
        result = getNextActions((args as { tag?: string }).tag);
        break;
      case 'get_waiting_for':
        result = getWaitingFor();
        break;
      case 'get_someday':
        result = getSomeday();
        break;
      case 'get_due_soon':
        result = getDueSoon((args as { days?: number }).days);
        break;
      case 'get_overdue':
        result = getOverdue();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Taskbed MCP server started');
}

main().catch(console.error);
