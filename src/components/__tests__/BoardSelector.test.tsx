import { vi } from 'vitest'

// Mock react-i18next before any other imports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'board.new.label': 'New Board',
        'board.new.placeholder': 'Enter board title...',
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: any) => children,
}))

import { render, screen, fireEvent } from '../../test/test-utils'
import { BoardSelector } from '../BoardSelector'
import { createMockBoard } from '../../test/test-helpers'

// Mock Zustand store
const mockStore = {
  boards: [createMockBoard({ id: 'board-1', title: 'Test Board' })],
  currentBoardId: 'board-1',
  selectBoard: vi.fn(),
  addBoard: vi.fn(),
  deleteBoard: vi.fn(),
}

vi.mock('../../store/task-store', () => ({
  useTaskStore: () => mockStore,
}))

describe('BoardSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render current board title', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Test Board' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    expect(screen.getByText('Test Board')).toBeInTheDocument()
  })

  it('should render "Select Board" when no current board', () => {
    mockStore.currentBoardId = ''
    mockStore.boards = []

    render(<BoardSelector />)

    expect(screen.getByText('Select Board')).toBeInTheDocument()
  })

  it('should toggle dropdown on button click', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Test Board' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    const button = screen.getByRole('button', { name: /test board/i })
    expect(screen.queryByText('New Board')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('New Board')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.queryByText('New Board')).not.toBeInTheDocument()
  })

  it('should display all boards in dropdown', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    expect(screen.getByText('Board Two')).toBeInTheDocument()
    expect(screen.getAllByText('Board One')).toHaveLength(2) // One in button, one in dropdown
  })

  it('should highlight current board', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    const boardItems = screen.getAllByText('Board One')
    const currentBoardItem = boardItems[1].closest('div') // The one in dropdown
    const boardTwoItem = screen.getByText('Board Two').closest('div')

    expect(currentBoardItem).toHaveClass('bg-primary-50')
    expect(boardTwoItem).not.toHaveClass('bg-primary-50')
  })

  it('should call selectBoard when board is clicked', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    const boardTwoItem = screen.getByText('Board Two').closest('div')
    fireEvent.click(boardTwoItem!)

    expect(mockStore.selectBoard).toHaveBeenCalledWith('board-2')
  })

  it('should close dropdown after selecting board', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    expect(screen.getByText('Board Two')).toBeInTheDocument()

    const boardTwoItem = screen.getByText('Board Two').closest('div')
    fireEvent.click(boardTwoItem!)
    expect(screen.queryByText('Board Two')).not.toBeInTheDocument()
  })

  it('should show add board form when plus button clicked', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    const addButton = screen.getByText('New Board')
    fireEvent.click(addButton)

    expect(screen.getByPlaceholderText('Enter board title...')).toBeInTheDocument()
  })

  it('should add board when form submitted', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    fireEvent.click(screen.getByText('New Board'))

    const input = screen.getByPlaceholderText('Enter board title...')
    const submitButton = screen.getByRole('button', { name: /add board/i })

    fireEvent.change(input, { target: { value: 'New Board' } })
    fireEvent.click(submitButton)

    expect(mockStore.addBoard).toHaveBeenCalledWith('New Board')
  })

  it('should add board on Enter key press', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    fireEvent.click(screen.getByText('New Board'))

    const input = screen.getByPlaceholderText('Enter board title...')
    fireEvent.change(input, { target: { value: 'New Board' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockStore.addBoard).toHaveBeenCalledWith('New Board')
  })

  it('should cancel add board on Escape key press', () => {
    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    fireEvent.click(screen.getByText('New Board'))

    const input = screen.getByPlaceholderText('Enter board title...')
    fireEvent.change(input, { target: { value: 'New Board' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(mockStore.addBoard).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Enter board title...')).not.toBeInTheDocument()
  })

  it('should not add empty board title', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    fireEvent.click(screen.getByText('New Board'))

    const input = screen.getByPlaceholderText('Enter board title...')
    const submitButton = screen.getByRole('button', { name: /add board/i })

    fireEvent.change(input, { target: { value: '   ' } }) // whitespace only
    fireEvent.click(submitButton)

    expect(mockStore.addBoard).not.toHaveBeenCalled()
  })

  it('should show delete button for boards when more than one exists', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    expect(screen.getAllByRole('button', { name: /delete board/i })).toHaveLength(2)
  })

  it('should not show delete button when only one board exists', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    expect(screen.queryByRole('button', { name: /delete board/i })).not.toBeInTheDocument()
  })

  it('should call deleteBoard when delete button clicked', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    const deleteButtons = screen.getAllByRole('button', { name: /delete board/i })
    fireEvent.click(deleteButtons[1]) // Delete second board

    expect(mockStore.deleteBoard).toHaveBeenCalledWith('board-2')
  })

  it('should prevent event propagation when delete button clicked', () => {
    mockStore.boards = [
      createMockBoard({ id: 'board-1', title: 'Board One' }),
      createMockBoard({ id: 'board-2', title: 'Board Two' }),
    ]

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))

    const deleteButtons = screen.getAllByRole('button', { name: /delete board/i })
    fireEvent.click(deleteButtons[1])

    // selectBoard should not be called because event was stopped
    expect(mockStore.selectBoard).not.toHaveBeenCalled()
  })

  it('should close dropdown when clicking outside', () => {
    mockStore.boards = [createMockBoard({ id: 'board-1', title: 'Board One' })]
    mockStore.currentBoardId = 'board-1'

    render(<BoardSelector />)

    fireEvent.click(screen.getByRole('button', { name: /board one/i }))
    expect(screen.getByText('New Board')).toBeInTheDocument()

    // Click outside (simulate mousedown on document body)
    fireEvent.mouseDown(document.body)

    expect(screen.queryByText('New Board')).not.toBeInTheDocument()
  })
})