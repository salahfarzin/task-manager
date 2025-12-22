import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '@/components/Board';
import { render } from '@/test/test-utils';
import { useTaskStore } from '../../store/task-store';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: any) => <>{children}</>,
}));

// Mock the store
vi.mock('../../store/task-store', () => ({
  useTaskStore: vi.fn(),
}));

// Capture dnd handlers to test them
let dndHandlers: any = {};

// Mock dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragOver, onDragEnd }: any) => {
    dndHandlers = { onDragStart, onDragOver, onDragEnd };
    return (
      <div data-testid="dnd-context">
        {children}
      </div>
    );
  },
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  closestCorners: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor: any) => sensor),
  useSensors: vi.fn((sensors: any) => sensors),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn() })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  horizontalListSortingStrategy: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

// Mock TaskList and TaskCard components
vi.mock('../TaskList', () => ({
  TaskList: ({ list, boardId }: any) => (
    <div data-testid={`task-list-${list.id}`} data-board-id={boardId}>
      <h3>{list.title}</h3>
      {list.tasks.map((task: any) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../TaskCard', () => ({
  TaskCard: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>
      {task.title}
    </div>
  ),
}));

describe('Board', () => {
  const mockStore = {
    boards: [
      {
        id: 'board-1',
        title: 'Test Board',
        lists: [
          {
            id: 'list-1',
            title: 'To Do',
            tasks: [
              { id: 'task-1', title: 'Task 1' },
              { id: 'task-2', title: 'Task 2' },
            ],
          },
          {
            id: 'list-2',
            title: 'In Progress',
            tasks: [
              { id: 'task-3', title: 'Task 3' },
            ],
          },
        ],
      },
    ],
    currentBoardId: 'board-1',
    addList: vi.fn(),
    moveTask: vi.fn(),
    moveList: vi.fn(),
    updateBoard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTaskStore as any).mockReturnValue(mockStore);
    dndHandlers = {};
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders board title and lists correctly', () => {
    render(<Board />);

    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByTestId('task-list-list-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-list-list-2')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('allows editing board title', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const titleElement = screen.getByText('Test Board');
    await user.click(titleElement);

    const input = screen.getByDisplayValue('Test Board');
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'Updated Board Title');
    await user.keyboard('{Enter}');

    expect(mockStore.updateBoard).toHaveBeenCalledWith('board-1', { title: 'Updated Board Title' });
  });

  it('cancels board title editing on Escape', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const titleElement = screen.getByText('Test Board');
    await user.click(titleElement);

    const input = screen.getByDisplayValue('Test Board');
    await user.clear(input);
    await user.type(input, 'Cancelled Title');
    await user.keyboard('{Escape}');

    expect(mockStore.updateBoard).not.toHaveBeenCalled();
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });

  it('adds a new list successfully', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const addListButton = screen.getByText('board.addList');
    await user.click(addListButton);

    const input = screen.getByPlaceholderText('placeholder.listName');
    expect(input).toBeInTheDocument();

    await user.type(input, 'New List');
    await user.keyboard('{Enter}');

    expect(mockStore.addList).toHaveBeenCalledWith('board-1', 'New List');
  });

  it('cancels adding a new list', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const addListButton = screen.getByText('board.addList');
    await user.click(addListButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockStore.addList).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('placeholder.listName')).not.toBeInTheDocument();
  });

  it('does not add empty list title', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const addListButton = screen.getByText('board.addList');
    await user.click(addListButton);

    screen.getByPlaceholderText('placeholder.listName');
    await user.keyboard('{Enter}');

    expect(mockStore.addList).not.toHaveBeenCalled();
  });

  // DnD Tests
  it('handles drag start', () => {
    render(<Board />);
    // Just verify handler is attached
    expect(dndHandlers.onDragStart).toBeDefined();
    
    // Simulate drag start
    dndHandlers.onDragStart({ active: { id: 'task-1' } });
    // This sets internal state, hard to verify without looking at effects implies by activeId.
    // We can assume it works if no crash.
  });

  it('handles drag over: moving task between lists', () => {
    render(<Board />);
    
    // Move task-1 (list-1) to list-2
    dndHandlers.onDragOver({
      active: { id: 'task-1' },
      over: { id: 'list-2' },
    });
    
    expect(mockStore.moveTask).toHaveBeenCalledWith(
      'task-1', 
      'list-1', 
      'list-2', 
      1 // Appended to end (list-2 had 1 task: task-3)
    );
  });

  it('handles drag over: moving task within same list (no op)', () => {
     render(<Board />);
     
     dndHandlers.onDragOver({
       active: { id: 'task-1' },
       over: { id: 'task-2' }, // Same list (list-1)
     });
     
     expect(mockStore.moveTask).not.toHaveBeenCalled();
  });

  it('handles drag end: moving list', () => {
    render(<Board />);

    // Move list-1 to list-2 position
    dndHandlers.onDragEnd({
      active: { id: 'list-1' },
      over: { id: 'list-2' },
    });

    expect(mockStore.moveList).toHaveBeenCalledWith('board-1', 0, 1);
  });

  it('handles drag end: reordering tasks in same list', () => {
    render(<Board />);

    // Move task-1 to task-2 position (swap)
    dndHandlers.onDragEnd({
      active: { id: 'task-1' },
      over: { id: 'task-2' },
    });

    expect(mockStore.moveTask).toHaveBeenCalledWith('task-1', 'list-1', 'list-1', 1);
  });

  it('renders drag overlay', () => {
    render(<Board />);
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  it('handles board with no lists', () => {
    const mockStoreEmpty = {
      ...mockStore,
      boards: [
        {
          id: 'board-1',
          title: 'Empty Board',
          lists: [],
        },
      ],
    };

    (useTaskStore as any).mockReturnValue(mockStoreEmpty);

    render(<Board />);

    expect(screen.getByText('Empty Board')).toBeInTheDocument();
    expect(screen.getByText('board.addList')).toBeInTheDocument();
  });

  it('handles board not found gracefully', () => {
    const mockStoreNoBoard = {
      ...mockStore,
      boards: [],
      currentBoardId: 'non-existent',
    };

    (useTaskStore as any).mockReturnValue(mockStoreNoBoard);

    render(<Board />);
    expect(screen.getByText('board.notFound')).toBeInTheDocument();
  });

  it('renders add list button with correct styling', () => {
    render(<Board />);

    const addButton = screen.getByText('board.addList');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('button')).toHaveClass('group');
  });

  it('focuses input when adding new list', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const addListButton = screen.getByText('board.addList');
    await user.click(addListButton);

    const input = screen.getByPlaceholderText('placeholder.listName');
    expect(input).toHaveFocus();
  });

  it('handles keyboard navigation in board title editing', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const titleElement = screen.getByText('Test Board');
    await user.click(titleElement);

    const input = screen.getByDisplayValue('Test Board');
    await user.clear(input);
    await user.type(input, 'New Title{enter}');

    expect(mockStore.updateBoard).toHaveBeenCalledWith('board-1', { title: 'New Title' });
  });

  it('maintains board title state during editing', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const titleElement = screen.getByText('Test Board');
    await user.click(titleElement);

    const input = screen.getByDisplayValue('Test Board');
    await user.clear(input);
    await user.type(input, 'Partial Title');

    // Click outside to blur
    await user.click(document.body);

    expect(mockStore.updateBoard).toHaveBeenCalledWith('board-1', { title: 'Partial Title' });
  });
});