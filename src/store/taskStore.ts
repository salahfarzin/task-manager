import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Attachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: Date;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    tags: string[];
    mentions: string[];
    attachments: Attachment[];
    createdAt: Date;
    updatedAt: Date;
    listId: string;
    order: number;
    dueDate?: Date;
}

export interface List {
    id: string;
    title: string;
    tasks: Task[];
    order: number;
}

export interface Board {
    id: string;
    title: string;
    lists: List[];
}

interface TaskStore {
    boards: Board[];
    currentBoardId: string;
    addBoard: (title: string) => void;
    selectBoard: (boardId: string) => void;
    updateBoard: (boardId: string, updates: Partial<Board>) => void;
    deleteBoard: (boardId: string) => void;
    addList: (boardId: string, title: string) => void;
    updateList: (boardId: string, listId: string, title: string) => void;
    deleteList: (boardId: string, listId: string) => void;
    moveList: (boardId: string, fromIndex: number, toIndex: number) => void;

    addTask: (boardId: string, listId: string, title: string) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, fromListId: string, toListId: string, newIndex: number) => void;

    addAttachment: (taskId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => void;
    removeAttachment: (taskId: string, attachmentId: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    boards: [
        {
            id: 'main-board',
            title: 'My Task Board',
            lists: [
                {
                    id: 'list-1',
                    title: 'To Do',
                    order: 0,
                    tasks: [
                        {
                            id: 'task-1',
                            title: 'Welcome to Task Manager',
                            description: '<p>This is a demo task. Click to edit!</p><p>You can:</p><ul><li>Add rich text descriptions</li><li>Upload attachments</li><li>Add tags</li><li>Mention team members</li></ul>',
                            tags: ['welcome', 'demo'],
                            mentions: [],
                            attachments: [],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            listId: 'list-1',
                            order: 0,
                            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                        },
                    ],
                },
                {
                    id: 'list-2',
                    title: 'In Progress',
                    order: 1,
                    tasks: [],
                },
                {
                    id: 'list-3',
                    title: 'Done',
                    order: 2,
                    tasks: [],
                },
            ],
        },
    ],
    currentBoardId: 'main-board',

    addBoard: (title) =>
        set((state) => {
            const newBoard: Board = {
                id: uuidv4(),
                title,
                lists: [
                    {
                        id: uuidv4(),
                        title: 'To Do',
                        order: 0,
                        tasks: [],
                    },
                    {
                        id: uuidv4(),
                        title: 'In Progress',
                        order: 1,
                        tasks: [],
                    },
                    {
                        id: uuidv4(),
                        title: 'Done',
                        order: 2,
                        tasks: [],
                    },
                ],
            };
            return {
                boards: [...state.boards, newBoard],
                currentBoardId: newBoard.id,
            };
        }),

    selectBoard: (boardId) =>
        set(() => ({
            currentBoardId: boardId,
        })),

    updateBoard: (boardId, updates) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId ? { ...board, ...updates } : board
            ),
        })),

    deleteBoard: (boardId) =>
        set((state) => {
            const newBoards = state.boards.filter((board) => board.id !== boardId);
            const newCurrentBoardId = state.currentBoardId === boardId
                ? (newBoards.length > 0 ? newBoards[0].id : '')
                : state.currentBoardId;
            return {
                boards: newBoards,
                currentBoardId: newCurrentBoardId,
            };
        }),

    addList: (boardId, title) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                        ...board,
                        lists: [
                            ...board.lists,
                            {
                                id: uuidv4(),
                                title,
                                tasks: [],
                                order: board.lists.length,
                            },
                        ],
                    }
                    : board
            ),
        })),

    updateList: (boardId, listId, title) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                        ...board,
                        lists: board.lists.map((list) =>
                            list.id === listId ? { ...list, title } : list
                        ),
                    }
                    : board
            ),
        })),

    deleteList: (boardId, listId) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                        ...board,
                        lists: board.lists.filter((list) => list.id !== listId),
                    }
                    : board
            ),
        })),

    moveList: (boardId, fromIndex, toIndex) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                        ...board,
                        lists: (() => {
                            const newLists = [...board.lists];
                            const [movedList] = newLists.splice(fromIndex, 1);
                            newLists.splice(toIndex, 0, movedList);
                            return newLists.map((list, index) => ({ ...list, order: index }));
                        })(),
                    }
                    : board
            ),
        })),

    addTask: (boardId, listId, title) =>
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                        ...board,
                        lists: board.lists.map((list) =>
                            list.id === listId
                                ? {
                                    ...list,
                                    tasks: [
                                        ...list.tasks,
                                        {
                                            id: uuidv4(),
                                            title,
                                            description: '',
                                            tags: [],
                                            mentions: [],
                                            attachments: [],
                                            createdAt: new Date(),
                                            updatedAt: new Date(),
                                            listId,
                                            order: list.tasks.length,
                                        },
                                    ],
                                }
                                : list
                        ),
                    }
                    : board
            ),
        })),

    updateTask: (taskId, updates) =>
        set((state) => ({
            boards: state.boards.map((board) => ({
                ...board,
                lists: board.lists.map((list) => ({
                    ...list,
                    tasks: list.tasks.map((task) =>
                        task.id === taskId
                            ? { ...task, ...updates, updatedAt: new Date() }
                            : task
                    ),
                })),
            })),
        })),

    deleteTask: (taskId) =>
        set((state) => ({
            boards: state.boards.map((board) => ({
                ...board,
                lists: board.lists.map((list) => ({
                    ...list,
                    tasks: list.tasks.filter((task) => task.id !== taskId),
                })),
            })),
        })),

    moveTask: (taskId, fromListId, toListId, newIndex) =>
        set((state) => {
            // Find the board containing the task
            const board = state.boards.find((b) =>
                b.lists.some((list) => list.tasks.some((task) => task.id === taskId))
            );
            if (!board) return state;

            const fromList = board.lists.find((list) => list.id === fromListId);
            const toList = board.lists.find((list) => list.id === toListId);

            if (!fromList || !toList) return state;

            const taskToMove = fromList.tasks.find((task) => task.id === taskId);
            if (!taskToMove) return state;

            const newTask = { ...taskToMove, listId: toListId };
            const newFromTasks = fromList.tasks.filter((task) => task.id !== taskId);
            const newToTasks = [...toList.tasks];
            newToTasks.splice(newIndex, 0, newTask);

            return {
                boards: state.boards.map((b) =>
                    b.id === board.id
                        ? {
                            ...b,
                            lists: b.lists.map((list) => {
                                if (list.id === fromListId) {
                                    return { ...list, tasks: newFromTasks };
                                }
                                if (list.id === toListId) {
                                    return { ...list, tasks: newToTasks };
                                }
                                return list;
                            }),
                        }
                        : b
                ),
            };
        }),

    addAttachment: (taskId, attachment) =>
        set((state) => ({
            boards: state.boards.map((board) => ({
                ...board,
                lists: board.lists.map((list) => ({
                    ...list,
                    tasks: list.tasks.map((task) =>
                        task.id === taskId
                            ? {
                                ...task,
                                attachments: [
                                    ...task.attachments,
                                    {
                                        ...attachment,
                                        id: uuidv4(),
                                        uploadedAt: new Date(),
                                    },
                                ],
                                updatedAt: new Date(),
                            }
                            : task
                    ),
                })),
            })),
        })),

    removeAttachment: (taskId, attachmentId) =>
        set((state) => ({
            boards: state.boards.map((board) => ({
                ...board,
                lists: board.lists.map((list) => ({
                    ...list,
                    tasks: list.tasks.map((task) =>
                        task.id === taskId
                            ? {
                                ...task,
                                attachments: task.attachments.filter((att) => att.id !== attachmentId),
                                updatedAt: new Date(),
                            }
                            : task
                    ),
                })),
            })),
        })),
}));
