import { render, screen, fireEvent } from '@/test/test-utils'
import { TaskCard } from '@/components/TaskCard'
import { vi } from 'vitest'
import { createMockTask } from '@/test/test-helpers'

// Mock Zustand store
const mockStore = {
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  removeAttachment: vi.fn(),
}

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => mockStore,
}))

// Mock components
vi.mock('../RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange }: any) => (
    <div data-testid="rich-text-editor">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        data-testid="editor-content"
      />
    </div>
  ),
}))

vi.mock('../FileUpload', () => ({
  FileUpload: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="file-upload">
      <button onClick={onClose} data-testid="file-upload-close">Close Upload</button>
    </div>
  ),
}))

// Mock @dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => {
    if (format === 'MMM dd, yyyy') return 'Jan 01, 2024'
    if (format === 'yyyy-MM-dd') return '2024-01-01'
    return date.toString()
  }),
  isPast: vi.fn(() => false),
  isToday: vi.fn(() => false),
  isTomorrow: vi.fn(() => false),
}))

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
})

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  Paperclip: () => <div data-testid="paperclip-icon">Paperclip</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  User: () => <div data-testid="user-icon">User</div>,
}))

describe('TaskCard', () => {
  const mockTask = createMockTask({
    id: 'task-1',
    title: 'Test Task',
    description: '<p>Test description</p>',
    tags: ['urgent', 'frontend'],
    mentions: ['@john', '@jane'],
    attachments: [
      {
        id: 'att-1',
        name: 'document.pdf',
        url: 'http://example.com/doc.pdf',
        size: 1024000, // 1000KB
        type: 'application/pdf',
        uploadedAt: new Date(),
      },
    ],
    dueDate: new Date('2024-01-15'),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  describe('Display Mode', () => {
    it('should render task title', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should render task description', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('should render tags', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText('urgent')).toBeInTheDocument()
      expect(screen.getByText('frontend')).toBeInTheDocument()
    })

    it('should render attachments', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText('task.attachments')).toBeInTheDocument()
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
      expect(screen.getByText('(1000.0KB)')).toBeInTheDocument()
    })

    it('should render mentions', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument() // @john -> J
      expect(screen.getByText('J')).toBeInTheDocument() // @jane -> J
    })

    it('should render due date', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument()
    })

    it('should render creation date', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText(/task.createdAt/)).toBeInTheDocument()
      expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument()
    })

    it('should show edit and delete buttons', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByLabelText('task.edit')).toBeInTheDocument()
      expect(screen.getByLabelText('task.delete')).toBeInTheDocument()
    })

    it('should show add attachment button', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByText('task.addAttachment')).toBeInTheDocument()
    })

    it('should show add tag input', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByPlaceholderText('task.addTag')).toBeInTheDocument()
    })
  })

  describe('Editing Mode', () => {
    it('should enter edit mode when edit button clicked', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.edit'))

      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
      expect(screen.getByText('action.save')).toBeInTheDocument()
      expect(screen.getByText('action.cancel')).toBeInTheDocument()
    })

    it('should save task changes', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.edit'))

      const titleInput = screen.getByDisplayValue('Test Task')
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } })

      const dateInput = screen.getByDisplayValue('2024-01-01')
      fireEvent.change(dateInput, { target: { value: '2024-02-01' } })

      fireEvent.click(screen.getByText('action.save'))

      expect(mockStore.updateTask).toHaveBeenCalledWith('task-1', {
        title: 'Updated Task',
        description: '<p>Test description</p>',
        dueDate: new Date('2024-02-01'),
      })
    })

    it('should cancel editing', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.edit'))
      fireEvent.click(screen.getByText('action.cancel'))

      expect(mockStore.updateTask).not.toHaveBeenCalled()
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should clear due date when empty', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.edit'))

      const dateInput = screen.getByDisplayValue('2024-01-01')
      fireEvent.change(dateInput, { target: { value: '' } })

      fireEvent.click(screen.getByText('action.save'))

      expect(mockStore.updateTask).toHaveBeenCalledWith('task-1', {
        title: 'Test Task',
        description: '<p>Test description</p>',
        dueDate: undefined,
      })
    })
  })

  describe('Tag Management', () => {
    it('should add new tag on Enter key press', () => {
      render(<TaskCard task={mockTask} />)

      const tagInput = screen.getByPlaceholderText('task.addTag')
      fireEvent.change(tagInput, { target: { value: 'new-tag' } })
      fireEvent.keyDown(tagInput, { key: 'Enter' })

      expect(mockStore.updateTask).toHaveBeenCalledWith('task-1', {
        tags: ['urgent', 'frontend', 'new-tag'],
      })
    })

    it('should not add empty tag', () => {
      render(<TaskCard task={mockTask} />)

      const tagInput = screen.getByPlaceholderText('task.addTag')
      fireEvent.change(tagInput, { target: { value: '   ' } })
      fireEvent.keyDown(tagInput, { key: 'Enter' })

      expect(mockStore.updateTask).not.toHaveBeenCalled()
    })

    it('should remove tag when clicked', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByText('urgent'))

      expect(mockStore.updateTask).toHaveBeenCalledWith('task-1', {
        tags: ['frontend'],
      })
    })
  })

  describe('Attachment Management', () => {
    it('should show file upload when add attachment clicked', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByText('task.addAttachment'))

      expect(screen.getByTestId('file-upload')).toBeInTheDocument()
    })

    it('should hide file upload when closed', () => {
      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByText('task.addAttachment'))
      fireEvent.click(screen.getByTestId('file-upload-close'))

      expect(screen.queryByTestId('file-upload')).not.toBeInTheDocument()
    })

    it('should remove attachment when delete button clicked', () => {
      render(<TaskCard task={mockTask} />)

      const deleteButton = screen.getAllByRole('button', { name: /x/i })[0]
      fireEvent.click(deleteButton)

      expect(mockStore.removeAttachment).toHaveBeenCalledWith('task-1', 'att-1')
    })
  })

  describe('Task Deletion', () => {
    it('should delete task when confirmed', () => {
      mockConfirm.mockReturnValue(true)

      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.delete'))

      expect(mockConfirm).toHaveBeenCalledWith('task.delete?')
      expect(mockStore.deleteTask).toHaveBeenCalledWith('task-1')
    })

    it('should not delete task when not confirmed', () => {
      mockConfirm.mockReturnValue(false)

      render(<TaskCard task={mockTask} />)

      fireEvent.click(screen.getByLabelText('task.delete'))

      expect(mockConfirm).toHaveBeenCalledWith('task.delete?')
      expect(mockStore.deleteTask).not.toHaveBeenCalled()
    })
  })

  describe('Due Date Styling', () => {
    it('should apply overdue styling for past due dates', () => {
      const { isPast } = require('date-fns')
      isPast.mockReturnValue(true)

      const overdueTask = createMockTask({
        dueDate: new Date('2023-01-01'),
      })

      render(<TaskCard task={overdueTask} />)

      const dueDateElement = screen.getByText('Jan 01, 2024')
      expect(dueDateElement).toHaveClass('text-red-700')
    })

    it('should apply today styling for due today', () => {
      const { isToday } = require('date-fns')
      isToday.mockReturnValue(true)

      const todayTask = createMockTask({
        dueDate: new Date(),
      })

      render(<TaskCard task={todayTask} />)

      const dueDateElement = screen.getByText('Jan 01, 2024')
      expect(dueDateElement).toHaveClass('text-orange-700')
    })

    it('should apply tomorrow styling for due tomorrow', () => {
      const { isTomorrow } = require('date-fns')
      isTomorrow.mockReturnValue(true)

      const tomorrowTask = createMockTask({
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      render(<TaskCard task={tomorrowTask} />)

      const dueDateElement = screen.getByText('Jan 01, 2024')
      expect(dueDateElement).toHaveClass('text-yellow-700')
    })
  })

  describe('Drag and Drop', () => {
    it('should apply dragging styles when isDragging is true', () => {
      const { useSortable } = require('@dnd-kit/sortable')
      useSortable.mockReturnValue({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: { x: 10, y: 10 },
        transition: 'transform 0.2s',
        isDragging: true,
      })

      render(<TaskCard task={mockTask} />)

      const card = screen.getByText('Test Task').closest('div')
      expect(card).toHaveClass('shadow-2xl')
      expect(card).toHaveStyle({ opacity: 0.5 })
    })

    it('should apply normal styles when not dragging', () => {
      render(<TaskCard task={mockTask} />)

      const card = screen.getByText('Test Task').closest('div')
      expect(card).toHaveClass('shadow-md')
      expect(card).toHaveStyle({ opacity: 1 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TaskCard task={mockTask} />)

      expect(screen.getByLabelText('task.edit')).toBeInTheDocument()
      expect(screen.getByLabelText('task.delete')).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<TaskCard task={mockTask} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty States', () => {
    it('should handle task without description', () => {
      const taskWithoutDesc = createMockTask({
        description: '',
      })

      render(<TaskCard task={taskWithoutDesc} />)

      expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument()
    })

    it('should handle task without tags', () => {
      const taskWithoutTags = createMockTask({
        tags: [],
      })

      render(<TaskCard task={taskWithoutTags} />)

      expect(screen.queryByText('urgent')).not.toBeInTheDocument()
    })

    it('should handle task without attachments', () => {
      const taskWithoutAttachments = createMockTask({
        attachments: [],
      })

      render(<TaskCard task={taskWithoutAttachments} />)

      expect(screen.queryByText('task.attachments')).not.toBeInTheDocument()
    })

    it('should handle task without mentions', () => {
      const taskWithoutMentions = createMockTask({
        mentions: [],
      })

      render(<TaskCard task={taskWithoutMentions} />)

      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument()
    })

    it('should handle task without due date', () => {
      const taskWithoutDueDate = createMockTask({
        dueDate: undefined,
      })

      render(<TaskCard task={taskWithoutDueDate} />)

      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument()
    })
  })
})