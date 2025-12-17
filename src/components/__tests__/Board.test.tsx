import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '@/components/Board';
import { render } from '@/test/test-utils';
import { useTaskStore } from '../store/taskStore';

// Mock the store
vi.mock('../store/taskStore', () => ({
  useTaskStore: vi.fn(),
}));

// Mock dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragOver, onDragEnd }: any) => (
    <div data-testid="dnd-context" data-on-drag-start={!!onDragStart} data-on-drag-over={!!onDragOver} data-on-drag-end={!!onDragEnd}>
      {children}
    </div>
  ),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  closestCorners: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor: any) => sensor),
  useSensors: vi.fn((sensors: any) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  horizontalListSortingStrategy: vi.fn(),
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
vi.mock('./TaskList', () => ({
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

vi.mock('./TaskCard', () => ({
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
    expect(screen.getByText('Updated Board Title')).toBeInTheDocument();
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

    const cancelButton = screen.getByRole('button', { name: /×/i });
    await user.click(cancelButton);

    expect(mockStore.addList).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('placeholder.listName')).not.toBeInTheDocument();
  });

  it('does not add empty list title', async () => {
    const user = userEvent.setup();
    render(<Board />);

    const addListButton = screen.getByText('board.addList');
    await user.click(addListButton);

    const input = screen.getByPlaceholderText('placeholder.listName');
    await user.keyboard('{Enter}');

    expect(mockStore.addList).not.toHaveBeenCalled();
  });

  it('handles drag start for tasks', () => {
    render(<Board />);

    const dndContext = screen.getByTestId('dnd-context');
    expect(dndContext).toHaveAttribute('data-on-drag-start', 'true');
  });

  it('handles drag over for moving tasks between lists', () => {
    const mockMoveTask = vi.fn();
    (useTaskStore as any).mockReturnValue({
      ...mockStore,
      moveTask: mockMoveTask,
    });

    render(<Board />);

    const dndContext = screen.getByTestId('dnd-context');
    expect(dndContext).toHaveAttribute('data-on-drag-over', 'true');
  });

  it('handles drag end for list reordering', () => {
    const mockMoveList = vi.fn();
    (useTaskStore as any).mockReturnValue({
      ...mockStore,
      moveList: mockMoveList,
    });

    render(<Board />);

    const dndContext = screen.getByTestId('dnd-context');
    expect(dndContext).toHaveAttribute('data-on-drag-end', 'true');
  });

  it('renders drag overlay when dragging a task', () => {
    // Mock active task state
    const mockStoreWithActiveTask = {
      ...mockStore,
      boards: [
        {
          ...mockStore.boards[0],
          lists: [
            {
              ...mockStore.boards[0].lists[0],
              tasks: [
                { id: 'active-task', title: 'Active Task' },
                ...mockStore.boards[0].lists[0].tasks,
              ],
            },
            ...mockStore.boards[0].lists.slice(1),
          ],
        },
      ],
    };

    (useTaskStore as any).mockReturnValue(mockStoreWithActiveTask);

    render(<Board />);

    const dragOverlay = screen.getByTestId('drag-overlay');
    expect(dragOverlay).toBeInTheDocument();
  });

  it('renders drag overlay when dragging a list', () => {
    render(<Board />);

    const dragOverlay = screen.getByTestId('drag-overlay');
    expect(dragOverlay).toBeInTheDocument();
  });

  it('applies correct CSS classes and animations', () => {
    render(<Board />);

    // Check for sortable context
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();

    // Check for animation delays on lists
    const listContainers = screen.getAllByTestId(/^task-list-/);
    expect(listContainers).toHaveLength(2);
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

    // Should not crash and should use first board as fallback
    expect(() => render(<Board />)).not.toThrow();
  });

  it('renders add list button with correct styling', () => {
    render(<Board />);

    const addButton = screen.getByText('board.addList');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('group');
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