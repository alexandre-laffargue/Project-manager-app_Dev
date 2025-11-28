Use `useKanbanBoard` here

Conventions for composables/kanban:
- File name starts with `use` and is the default export.
- Keep composable responsibility focused: state + side effects for Kanban board.
- Avoid DOM APIs and global confirm/prompt when possible; let consumers handle UI.

Example import:
```js
import useKanbanBoard from '@/composables/kanban/useKanbanBoard'
```
