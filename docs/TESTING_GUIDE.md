# React Testing Best Practices Guide

## 🧪 Testing Philosophy

### What to Test
- **User interactions** (clicks, typing, navigation)
- **Component behavior** (rendering, state changes)
- **Integration points** (API calls, context usage)
- **Error states** and edge cases
- **Accessibility** (ARIA labels, keyboard navigation)

### What NOT to Test
- Implementation details (internal functions)
- Third-party library internals
- CSS/styling (unless critical for UX)
- Exact HTML structure (use semantic queries)

## 🏗️ Project Structure

```
src/
├── components/
│   ├── __tests__/
│   │   ├── Component.test.tsx
│   │   └── Component.integration.test.tsx
├── contexts/
│   ├── __tests__/
├── hooks/
│   ├── __tests__/
├── test/
│   ├── test-utils.tsx      # Custom render functions
│   ├── test-helpers.ts     # Mock factories & utilities
│   └── setup.ts           # Global test setup
```

## 🛠️ Testing Utilities

### Custom Render Function (`test-utils.tsx`)
```tsx
// Automatically wraps components with all necessary providers
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

const AllTheProviders = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>{children}</ThemeProvider>
  </I18nextProvider>
)

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Test Helpers (`test-helpers.ts`)
```tsx
// Reusable mock factories and utilities
export const mockLocalStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
})

export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  createdAt: new Date(),
  ...overrides,
})
```

## 📝 Test Patterns

### 1. Arrange-Act-Assert (AAA) Pattern
```tsx
it('should handle user login', () => {
  // Arrange
  const mockUser = createMockUser()
  mockApi.login.mockResolvedValue(mockUser)

  // Act
  render(<LoginForm />)
  fireEvent.click(screen.getByRole('button', { name: /login/i }))

  // Assert
  await waitFor(() => {
    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
  })
})
```

### 2. Component Testing
```tsx
describe('TaskCard', () => {
  it('should render task title', () => {
    const mockTask = createMockTask({ title: 'Test Task' })
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should call onEdit when edit button clicked', () => {
    const mockOnEdit = vi.fn()
    const mockTask = createMockTask()

    render(<TaskCard task={mockTask} onEdit={mockOnEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask.id)
  })
})
```

### 3. Hook Testing
```tsx
describe('useTheme', () => {
  it('should throw when used outside provider', () => {
    const TestComponent = () => {
      useTheme() // Should throw
      return null
    }

    expect(() => render(<TestComponent />)).toThrow()
  })
})
```

### 4. Integration Testing
```tsx
describe('TaskBoard Integration', () => {
  it('should add task to list', async () => {
    render(<TaskBoard />)

    // Simulate user adding a task
    const input = screen.getByPlaceholderText(/add a task/i)
    const addButton = screen.getByRole('button', { name: /add/i })

    fireEvent.change(input, { target: { value: 'New Task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument()
    })
  })
})
```

## 🎯 Query Priorities

Use semantic queries over brittle selectors:

```tsx
// ✅ Good - Semantic & accessible
screen.getByRole('button', { name: /save/i })
screen.getByLabelText(/email/i)

// ❌ Avoid - Brittle & implementation-dependent
screen.getByTestId('save-button')
container.querySelector('.save-btn')
```

## 🔄 Mocking Strategies

### API Calls
```tsx
// Mock external APIs
vi.mock('../api/tasks', () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
}))

// Use in tests
import { fetchTasks } from '../api/tasks'

it('should load tasks', async () => {
  const mockTasks = [createMockTask()]
  fetchTasks.mockResolvedValue(mockTasks)

  render(<TaskList />)

  await waitFor(() => {
    expect(screen.getByText(mockTasks[0].title)).toBeInTheDocument()
  })
})
```

### Browser APIs
```tsx
// Mock localStorage, fetch, etc.
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage(),
  writable: true,
})
```

## ♿ Accessibility Testing

```tsx
it('should be accessible', () => {
  render(<MyComponent />)

  // Check ARIA labels
  expect(screen.getByRole('button')).toHaveAccessibleName()

  // Check keyboard navigation
  const button = screen.getByRole('button')
  button.focus()
  expect(button).toHaveFocus()

  // Use axe for comprehensive a11y testing
  expect(await axe(container)).toHaveNoViolations()
})
```

## 📊 Coverage Goals

```json
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
}
```

## 🚀 Performance Testing

```tsx
it('should render large list efficiently', async () => {
  const largeTaskList = Array.from({ length: 1000 }, createMockTask)

  const { rerender } = render(<TaskList tasks={largeTaskList} />)

  // Measure render time
  const startTime = performance.now()
  rerender(<TaskList tasks={[...largeTaskList, createMockTask()]} />)
  const endTime = performance.now()

  expect(endTime - startTime).toBeLessThan(100) // ms
})
```

## 🔧 Common Patterns

### Testing Async Operations
```tsx
it('should handle async data loading', async () => {
  render(<AsyncComponent />)

  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText(/data loaded/i)).toBeInTheDocument()
  })
})
```

### Testing Error States
```tsx
it('should show error message on failure', async () => {
  mockApi.fetchData.mockRejectedValue(new Error('API Error'))

  render(<DataComponent />)

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

### Testing Forms
```tsx
it('should validate form input', async () => {
  render(<ContactForm />)

  const input = screen.getByLabelText(/email/i)
  const submitButton = screen.getByRole('button', { name: /submit/i })

  fireEvent.change(input, { target: { value: 'invalid-email' } })
  fireEvent.click(submitButton)

  await waitFor(() => {
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })
})
```

## 📋 Checklist for New Tests

- [ ] Uses semantic queries (getByRole, getByLabelText)
- [ ] Tests user interactions, not implementation details
- [ ] Includes accessibility checks
- [ ] Handles async operations properly
- [ ] Tests error states and edge cases
- [ ] Uses descriptive test names
- [ ] Follows AAA pattern
- [ ] Mocks external dependencies appropriately
- [ ] Includes proper cleanup in beforeEach/afterEach