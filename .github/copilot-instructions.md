# Task Manager - AI Coding Assistant Instructions

## Architecture Overview

This is a modern React TypeScript Kanban-style task management application built with:
- **React 19** with concurrent features and TypeScript for type safety
- **Zustand** for lightweight, scalable state management (single store pattern)
- **@dnd-kit** for advanced drag-and-drop functionality (sortable lists and cards)
- **TipTap** for rich text editing in task descriptions
- **Tailwind CSS v4** with custom theme configuration and glass morphism effects
- **i18next** for internationalization (English/Persian with RTL support)
- **Vite** for fast development and optimized builds

### Data Flow & State Management

- **Single Source of Truth**: All app state managed in `src/store/taskStore.ts` using Zustand
- **Data Structure**: Board → Lists → Tasks (hierarchical with order properties for sorting)
- **No External APIs**: All data stored in memory (theme persists to localStorage)
- **Real-time Updates**: Zustand provides instant UI updates across components

### Key Components & Patterns

- **Board** (`src/components/Board.tsx`): Main container with drag-drop context, handles list/task reordering
- **TaskList** (`src/components/TaskList.tsx`): Renders task cards, manages list-level operations
- **TaskCard** (`src/components/TaskCard.tsx`): Complex component with display/edit modes, handles all task interactions
- **RichTextEditor** (`src/components/RichTextEditor.tsx`): TipTap-based WYSIWYG editor
- **FileUpload** (`src/components/FileUpload.tsx`): Drag-drop file attachment component

### Drag & Drop Implementation

Complex multi-level drag-drop using @dnd-kit:
- **List Reordering**: Horizontal sorting of lists within boards
- **Task Reordering**: Vertical sorting within lists + cross-list moves
- **Visual Feedback**: Drag overlays, opacity changes, transform animations
- **Collision Detection**: `closestCorners` strategy for precise drop zones

## Development Workflow

### Essential Commands
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build with TypeScript checking
npm run preview      # Preview production build locally
npm run test         # Run Vitest test suite
npm run lint         # ESLint code quality checks
npm run type-check   # Standalone TypeScript checking
```

### Testing Strategy
- **Framework**: Vitest with @testing-library/react
- **Setup**: Custom render function in `src/test/test-utils.tsx` wraps components with ThemeProvider + I18nextProvider
- **Mocking**: Comprehensive mocks for Zustand store, @dnd-kit, date-fns, lucide-react icons, browser APIs
- **Patterns**: AAA (Arrange-Act-Assert), semantic queries (`getByRole`, `getByLabelText`), avoid brittle selectors
- **Coverage**: 80% thresholds for statements/branches/functions/lines

### Code Organization
- **Path Aliases**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- **Component Structure**: Flat in `src/components/`, tests in `__tests__/` subdirectories
- **State Management**: Single Zustand store with typed interfaces
- **Styling**: Tailwind utility classes with custom CSS variables in `src/index.css`
- **Internationalization**: Translation keys like `'task.edit'`, `'action.save'` - always use `t()` function

## Project-Specific Conventions

### Component Patterns
- **Conditional Rendering**: Display vs Edit modes (TaskCard, Board title editing)
- **Animation Classes**: `animate-fade-in`, `animate-slide-in`, `animate-scale-in` for smooth UX
- **Glass Morphism**: `glass` class for frosted glass effects with backdrop-blur
- **RTL Support**: `rtl:space-x-reverse` for right-to-left layouts
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation

### State Management Patterns
- **Immutable Updates**: Always spread objects (`{ ...task, ...updates }`)
- **Nested Updates**: Deep updates for boards → lists → tasks structure
- **Order Management**: `order` properties for drag-drop sorting
- **Date Handling**: `date-fns` for formatting/parsing, store dates as Date objects

### Testing Conventions
- **Mock Factories**: `createMockTask()`, `createMockList()` in `src/test/test-helpers.ts`
- **Store Mocking**: Mock Zustand store with `vi.mock()` in test files
- **External Dependencies**: Mock @dnd-kit, date-fns, lucide-react, window.confirm
- **Async Testing**: `waitFor()` for state updates, proper cleanup

### Styling Patterns
- **Color System**: Primary blue (#3b82f6) with full Tailwind shade spectrum
- **Theme Variables**: CSS custom properties in `src/index.css` for Tailwind v4
- **Responsive Design**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark Mode**: Automatic with `dark:` prefixes, persisted to localStorage

### File Upload & Attachments
- **react-dropzone**: For drag-drop file handling
- **Attachment Storage**: In-memory with metadata (name, size, type, upload date)
- **Size Display**: Convert bytes to KB with `(size / 1024).toFixed(1)`

### Internationalization
- **Key Structure**: `component.action` (e.g., `task.edit`, `board.addList`)
- **Language Switching**: Affects document `dir` and `lang` attributes
- **RTL Layout**: Persian (fa) triggers right-to-left layout adjustments

## Common Tasks & Patterns

### Adding New Task Features
1. Update `Task` interface in `taskStore.ts`
2. Add state management actions in Zustand store
3. Update TaskCard component for display/editing UI
4. Add translation keys in `i18n.ts`
5. Write comprehensive tests with proper mocking

### Component Development
1. Use TypeScript interfaces for props
2. Implement accessibility (ARIA labels, keyboard support)
3. Add smooth animations and hover effects
4. Test with React Testing Library using semantic queries
5. Follow existing patterns for conditional rendering

### State Updates
- Always use store actions for state changes
- Handle nested updates carefully (boards → lists → tasks)
- Update `updatedAt` timestamps on modifications
- Maintain `order` properties for drag-drop functionality

### Drag & Drop Modifications
- Use @dnd-kit's `useSortable` hook for draggable items
- Handle `DragStart`, `DragOver`, `DragEnd` events in DndContext
- Update order arrays and move items between containers
- Provide visual feedback during drag operations

## Quality Assurance

### Code Quality
- ESLint with React hooks and refresh plugins
- TypeScript strict mode enabled
- Prettier for consistent formatting (inferred from ESLint)

### Performance Considerations
- React 19 concurrent features for smooth interactions
- Vite's fast HMR for development
- Optimized bundle splitting and tree shaking
- Efficient re-renders with Zustand selective subscriptions

### Browser Support
- Modern browsers with ES2020+ features
- CSS Grid and Flexbox for layouts
- CSS custom properties for theming
- Progressive enhancement approach