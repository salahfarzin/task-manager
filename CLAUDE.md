# Task Manager — Claude Instructions

Kanban-style task management SPA. React 19 + TypeScript + Zustand + @dnd-kit + TipTap + Tailwind CSS v4.

## Commands

```bash
npm run dev            # Vite dev server → http://localhost:5173
npm run build          # tsc -b && vite build
npm run test           # Vitest (watch)
npm run test:ci        # Vitest (single run)
npm run test:coverage  # Coverage report (80% thresholds)
npm run lint           # ESLint
npm run type-check     # Standalone TypeScript check
```

Copy `.env.example` → `.env` before running locally.

## Architecture

### Data model
```
Board → List[] → Task[]
```
All state lives in a single Zustand store: `src/store/task-store.ts`.  
Auth state lives in `src/store/auth-store.ts` (uses `src/lib/http-client.ts` with HTTP-only cookie auth).  
No Redux, no Context for app state — only Zustand.

### Key components
| File | Purpose |
|------|---------|
| `src/components/Board.tsx` | DndContext root, list/task reordering |
| `src/components/TaskList.tsx` | Sortable list container |
| `src/components/TaskCard.tsx` | Display + edit modes, all task interactions |
| `src/components/TaskEditModal.tsx` | Full-screen task edit modal |
| `src/components/RichTextEditor.tsx` | TipTap WYSIWYG editor |
| `src/components/FileUpload.tsx` | react-dropzone attachment handler |
| `src/components/BoardSelector.tsx` | Board switcher |
| `src/components/Header.tsx` | App header with theme/language toggles |

### Path aliases
`@/` → `src/`

### Routing
Uses `react-router-dom` v7. Base path from `VITE_APP_BASE_PATH` env var (default `/`).

## Code Conventions

### TypeScript / React
- Strict mode enabled.
- Multiline `if` blocks with braces on separate lines — never inline `if (cond) return x;`.
- Functional components only; no class components.
- Props typed with inline interfaces, not `type`.

### State updates
- Always spread for immutability: `{ ...task, ...updates }`.
- Always update `updatedAt` when modifying a task.
- Maintain `order` properties after drag-drop operations.

### Styling
- Tailwind utility classes; custom CSS variables in `src/index.css`.
- Use `glass` class for frosted-glass surfaces.
- RTL: add `rtl:space-x-reverse` mirror classes.
- Dark mode: `dark:` prefixes; theme persisted in `localStorage`.

### i18n
- Every user-visible string must go through `t('key')` — never hardcode UI text.
- Key structure: `component.action` (e.g. `task.edit`, `board.addList`).
- Language switch updates `document.dir` and `document.lang`.

### Drag & Drop
- Use `useSortable` from `@dnd-kit/sortable` for draggable items.
- Handle `DragStart` / `DragOver` / `DragEnd` in `DndContext`.
- Collision strategy: `closestCorners`.

### File attachments
- Stored in-memory as `Attachment` objects (no upload endpoint).
- Size display: `(bytes / 1024).toFixed(1) + ' KB'`.

## Testing

- **Framework**: Vitest + @testing-library/react.
- **Custom render**: `src/test/test-utils.tsx` — wraps with `ThemeProvider` + `I18nextProvider`.
- **Factories**: `createMockTask()`, `createMockList()` in `src/test/test-helpers.ts`.
- **Mocking**: `vi.mock()` for Zustand store, @dnd-kit, date-fns, lucide-react, `window.confirm`.
- **Queries**: prefer semantic (`getByRole`, `getByLabelText`) over brittle selectors.
- **Async**: `waitFor()` for state-driven updates; always clean up.
- **Pattern**: Arrange → Act → Assert.

Tests live in `src/components/__tests__/` co-located with components.

## Don't
- Don't add features or refactor code beyond what is asked.
- Don't hardcode UI strings — always use `t()`.
- Don't write class components.
- Don't bypass ESLint or TypeScript errors with `// @ts-ignore` or `eslint-disable`.
- Don't create new Zustand stores for app state — extend the existing `task-store.ts`.
- Don't use `any` unless absolutely necessary and justified with a comment.
