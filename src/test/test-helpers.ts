// Testing utilities and helpers
export const createMockStore = (initialState = {}) => {
  return {
    ...initialState,
    // Add mock methods as needed
  }
}

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

export const mockDocumentElement = () => ({
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn(),
  },
})

// Common test data factories
export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  dueDate: undefined,
  tags: [],
  attachments: [],
  mentions: [],
  listId: 'list-1',
  order: 0,
  estimation: 0,
  assignee: undefined,
  ...overrides,
})

export const createMockList = (overrides = {}) => ({
  id: 'list-1',
  title: 'Test List',
  tasks: [],
  createdAt: new Date(),
  ...overrides,
})

export const createMockBoard = (overrides = {}) => ({
  id: 'board-1',
  title: 'Test Board',
  lists: [],
  createdAt: new Date(),
  ...overrides,
})