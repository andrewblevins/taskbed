# Relationships as a First-Class Concept

## The Problem

Many tasks are fundamentally about people, but the current system treats people as incidental - just words buried in task titles:

- "Ask Aashiq for a blurb for my coaching website"
- "Send Charlie a message asking about how he did it"
- "Respond to Michael Tong and schedule next conversation"
- "Check whether Mom and Dad have called Parkridge"

This means:
- You can't see all your open threads with a person at a glance
- You can't batch "messages to send" before opening your email
- You lose track of relationship rhythm (when did I last talk to X?)
- Waiting-for items get lost because the "who" isn't queryable

## Proposed Data Model

```typescript
interface Person {
  id: string;
  name: string;
  context?: string;        // "coaching client", "family", "collaborator"
  lastContactedAt?: number;
  notes?: string;
}

interface Task {
  // ... existing fields
  personIds?: string[];    // tasks can involve multiple people
  waitingFor?: string;     // personId if this task is blocked on someone
}
```

## UI Concepts

### People View
A dedicated view showing all people with:
- Name and context
- Count of open tasks involving them
- Count of tasks waiting on them
- Days since last contact
- Quick action to add a task mentioning them

### Relationship Indicators in Task List
When viewing tasks, show a small avatar or initials badge for tasks involving people. Clicking filters to that person.

### "Waiting For" as a First-Class State
GTD's "Waiting For" list becomes more powerful when tied to people:
- See all items you're waiting on, grouped by person
- When you're about to meet with someone, pull up everything pending with them
- Set reminders to follow up if no response after X days

### Batched Communication Mode
A focused view for when you sit down to send messages:
- Shows all tasks that are essentially "message X about Y"
- Grouped by communication channel if known (email, text, in-person)
- Check off as you send, automatically logs contact timestamp

## Migration Strategy

1. Add `Person` type and `people: Person[]` to store
2. Scan existing tasks for common names, suggest creating Person entries
3. Add UI to link tasks to people (autocomplete as you type names)
4. Build the People view
5. Add "Waiting For" filter that cross-references people

## Open Questions

- Should people have relationship "types" (family, client, collaborator, friend)?
- How to handle task titles that mention people vs. formal linking?
- Integration with contacts/address book?
- Should there be a "relationship health" indicator (e.g., flag people you haven't contacted in 30+ days)?

## Why This Matters

Your work is deeply relational - teaching, coaching, facilitating, caring for family. A task system that understands relationships becomes a relationship maintenance system, not just a to-do list.
