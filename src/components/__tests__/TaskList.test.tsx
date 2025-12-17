import { vi } from 'vitest'

// Mock react-i18next before any other imports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'board.addCard': 'Add Card',
        'board.deleteList': 'Delete List',
        'placeholder.taskTitle': 'Enter task title...',
        'action.create': 'Create',
        'action.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: any) => children,
}))

import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { TaskList } from '../TaskList'
import { createMockList, createMockTask } from '../../test/test-helpers'

// Mock Zustand store
const mockStore = {
  addTask: vi.fn(),
  deleteList: vi.fn(),
}

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => mockStore,
}))

// Mock TaskCard component
vi.mock('../TaskCard', () => ({
  TaskCard: ({ task }: any) => <div data-testid={`task-card-${task.id}`}>{task.title}</div>,
}))

// Mock @dnd-kit components
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: vi.fn(),
}))

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}))

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  MoreVertical: () => <div data-testid="more-vertical-icon">MoreVertical</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
}))

describe('TaskList', () => {
  const mockBoardId = 'board-1'
  const mockList = createMockList({
    id: 'list-1',
    title: 'Test List',
    tasks: [
      createMockTask({ id: 'task-1', title: 'Task 1' }),
      createMockTask({ id: 'task-2', title: 'Task 2' }),
    ],
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true) // Default to confirming deletions
  })

  it('should render list title and task count', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    expect(screen.getByText('Test List')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('should render all tasks', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument()
    expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument()
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should render add task button when not adding', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    expect(screen.getByText('Add Card')).toBeInTheDocument()
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('should show add task form when add button clicked', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    const addButton = screen.getByText('Add Card')
    fireEvent.click(addButton)

    expect(screen.getByPlaceholderText('Enter task title...')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should add task when form submitted', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open add form
    fireEvent.click(screen.getByText('Add Card'))

    // Fill form
    const input = screen.getByPlaceholderText('Enter task title...')
    fireEvent.change(input, { target: { value: 'New Task' } })

    // Submit
    fireEvent.click(screen.getByText('Create'))

    expect(mockStore.addTask).toHaveBeenCalledWith(mockBoardId, mockList.id, 'New Task')
  })

  it('should add task on Enter key press', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open add form
    fireEvent.click(screen.getByText('Add Card'))

    // Fill form and press Enter
    const input = screen.getByPlaceholderText('Enter task title...')
    fireEvent.change(input, { target: { value: 'New Task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockStore.addTask).toHaveBeenCalledWith(mockBoardId, mockList.id, 'New Task')
  })

  it('should not add empty task', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open add form
    fireEvent.click(screen.getByText('Add Card'))

    // Try to submit empty form
    fireEvent.click(screen.getByText('Create'))

    expect(mockStore.addTask).not.toHaveBeenCalled()
  })

  it('should cancel adding task', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open add form
    fireEvent.click(screen.getByText('Add Card'))

    // Fill form
    const input = screen.getByPlaceholderText('Enter task title...')
    fireEvent.change(input, { target: { value: 'New Task' } })

    // Cancel
    fireEvent.click(screen.getByText('Cancel'))

    expect(mockStore.addTask).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Enter task title...')).not.toBeInTheDocument()
  })

  it('should show menu when more button clicked', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    const menuButton = screen.getByRole('button', { name: /MoreVertical/i })
    fireEvent.click(menuButton)

    expect(screen.getByText('Delete List')).toBeInTheDocument()
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
  })

  it('should hide menu when clicked again', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    const menuButton = screen.getByRole('button', { name: /MoreVertical/i })
    fireEvent.click(menuButton)
    expect(screen.getByText('Delete List')).toBeInTheDocument()

    fireEvent.click(menuButton)
    expect(screen.queryByText('Delete List')).not.toBeInTheDocument()
  })

  it('should delete list when confirmed', () => {
    mockConfirm.mockReturnValue(true)

    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open menu
    const menuButton = screen.getByRole('button', { name: /MoreVertical/i })
    fireEvent.click(menuButton)

    // Click delete
    fireEvent.click(screen.getByText('Delete List'))

    expect(mockConfirm).toHaveBeenCalledWith('Delete "Test List"?')
    expect(mockStore.deleteList).toHaveBeenCalledWith(mockBoardId, mockList.id)
  })

  it('should not delete list when not confirmed', () => {
    mockConfirm.mockReturnValue(false)

    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open menu
    const menuButton = screen.getByRole('button', { name: /MoreVertical/i })
    fireEvent.click(menuButton)

    // Click delete
    fireEvent.click(screen.getByText('Delete List'))

    expect(mockConfirm).toHaveBeenCalledWith('Delete "Test List"?')
    expect(mockStore.deleteList).not.toHaveBeenCalled()
  })

  it('should close menu after delete action', () => {
    mockConfirm.mockReturnValue(true)

    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open menu
    const menuButton = screen.getByRole('button', { name: /MoreVertical/i })
    fireEvent.click(menuButton)
    expect(screen.getByText('Delete List')).toBeInTheDocument()

    // Click delete
    fireEvent.click(screen.getByText('Delete List'))

    expect(screen.queryByText('Delete List')).not.toBeInTheDocument()
  })

  it('should render empty list correctly', () => {
    const emptyList = createMockList({
      id: 'empty-list',
      title: 'Empty List',
      tasks: [],
    })

    render(<TaskList list={emptyList} boardId={mockBoardId} />)

    expect(screen.getByText('Empty List')).toBeInTheDocument()
    expect(screen.getByText('(0)')).toBeInTheDocument()
    expect(screen.queryByTestId(/task-card-/)).not.toBeInTheDocument()
  })

  it('should have proper droppable area', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // The droppable area should have the setNodeRef applied
    const taskArea = screen.getByTestId('sortable-context').parentElement
    expect(taskArea).toHaveClass('flex-1', 'overflow-y-auto')
  })

  it('should render tasks in sortable context', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument()
    expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    const listContainer = screen.getByText('Test List').closest('.flex-shrink-0')
    expect(listContainer).toHaveClass('w-80')

    const glassContainer = listContainer?.querySelector('.glass')
    expect(glassContainer).toHaveClass('rounded-xl', 'p-4', 'shadow-lg')
  })

  it('should handle task count display correctly', () => {
    const singleTaskList = createMockList({
      id: 'single-list',
      title: 'Single Task List',
      tasks: [createMockTask()],
    })

    render(<TaskList list={singleTaskList} boardId={mockBoardId} />)

    expect(screen.getByText('Single Task List')).toBeInTheDocument()
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('should clear input when canceling add task', () => {
    render(<TaskList list={mockList} boardId={mockBoardId} />)

    // Open add form and type
    fireEvent.click(screen.getByText('Add Card'))
    const input = screen.getByPlaceholderText('Enter task title...')
    fireEvent.change(input, { target: { value: 'Some text' } })

    // Cancel
    fireEvent.click(screen.getByText('Cancel'))

    // Re-open form
    fireEvent.click(screen.getByText('Add Card'))
    const newInput = screen.getByPlaceholderText('Enter task title...')

    expect(newInput).toHaveValue('') // Should be cleared
  })
})