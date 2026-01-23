# Taskbed

A flexible task manager inspired by Things, with built-in support for energy-based task categorization.

## Why Taskbed?

Traditional task managers focus on due dates and priorities, but often what determines whether you'll actually complete a task is how much energy it requires versus how much energy you have. Taskbed lets you categorize tasks by energy level (High/Medium/Low) and view them grouped accordingly—so when you're feeling drained, you can tackle low-energy tasks, and when you're fired up, you can take on the big stuff.

## Features

- **Energy-based grouping** - Tasks are grouped by energy level (High, Medium, Low) by default
- **Flexible attributes** - Create custom attributes beyond energy (context, type, etc.)
- **Projects** - Organize tasks into projects
- **Persistent storage** - All data saved to localStorage
- **Minimal UI** - Clean interface focused on getting things done

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Add a task** - Type in the input field and press Enter
2. **Edit a task** - Click on a task to open the detail panel
3. **Set energy level** - In the detail panel, select High/Medium/Low
4. **Complete a task** - Click the checkbox
5. **Change grouping** - Use the dropdown in the header to group by different attributes

## Tech Stack

- React 19
- TypeScript
- Zustand (state management)
- Vite
