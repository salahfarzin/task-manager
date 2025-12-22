import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useTaskStore } from '../store/task-store';
import { TaskList } from './TaskList';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import type { List } from '../store/task-store';

interface SortableListProps {
  list: List;
  boardId: string;
}

const SortableList: React.FC<SortableListProps> = ({ list, boardId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskList list={list} boardId={boardId} />
    </div>
  );
};

export const Board: React.FC = () => {
  const { t } = useTranslation();
  const { boards, currentBoardId, addList, moveTask, moveList, updateBoard } = useTaskStore();
  const currentBoard = boards.find((b) => b.id === currentBoardId) || boards[0];



  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(currentBoard?.title || '');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSaveBoardTitle = () => {
    if (currentBoard) {
      updateBoard(currentBoard.id, { title: boardTitle });
    }
    setIsEditingBoardTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveBoardTitle();
    } else if (e.key === 'Escape') {
      setBoardTitle(currentBoard.title);
      setIsEditingBoardTitle(false);
    }
  };

  const handleAddList = () => {
    if (newListTitle.trim() && currentBoard) {
      addList(currentBoard.id, newListTitle.trim());
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const isList = currentBoard.lists.some(list => list.id === event.active.id);
    if (isList) {
      setActiveListId(event.active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task and lists
    const activeList = currentBoard.lists.find((list) =>
      list.tasks.some((task) => task.id === activeId)
    );
    
    let overList = currentBoard.lists.find((list) =>
      list.tasks.some((task) => task.id === overId)
    );

    // If over is a list, not a task
    if (!overList) {
      overList = currentBoard.lists.find((list) => list.id === overId);
    }

    if (!activeList || !overList) return;

    // If moving to a different list
    if (activeList.id !== overList.id) {
      const activeTask = activeList.tasks.find((task) => task.id === activeId);
      if (!activeTask) return;

      const overTaskIndex = overList.tasks.findIndex((task) => task.id === overId);
      const newIndex = overTaskIndex >= 0 ? overTaskIndex : overList.tasks.length;

      moveTask(activeId, activeList.id, overList.id, newIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveListId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Handle list reordering
    const activeList = currentBoard.lists.find(list => list.id === activeId);
    if (activeList) {
      const overList = currentBoard.lists.find(list => list.id === overId);
      if (overList) {
        const fromIndex = currentBoard.lists.indexOf(activeList);
        const toIndex = currentBoard.lists.indexOf(overList);
        if (fromIndex !== toIndex) {
          moveList(currentBoard.id, fromIndex, toIndex);
        }
      }
      return;
    }

    // Handle task reordering within the same list
    const activeListForTask = currentBoard.lists.find((list) =>
      list.tasks.some((task) => task.id === activeId)
    );
    
    const overListForTask = currentBoard.lists.find((list) =>
      list.tasks.some((task) => task.id === overId)
    );

    if (activeListForTask && overListForTask && activeListForTask.id === overListForTask.id) {
      const oldIndex = activeListForTask.tasks.findIndex((task) => task.id === activeId);
      const newIndex = activeListForTask.tasks.findIndex((task) => task.id === overId);

      if (oldIndex !== newIndex) {
        moveTask(activeId, activeListForTask.id, activeListForTask.id, newIndex);
      }
    }
  };




  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-medium">
        {t('board.notFound')}
      </div>
    );
  }

  const activeTask = currentBoard.lists
    .flatMap((list) => list.tasks)
    .find((task) => task.id === activeId);

  const activeList = currentBoard.lists.find((list) => list.id === activeListId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          {isEditingBoardTitle ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleSaveBoardTitle}
              onKeyDown={handleKeyDown}
              className="text-3xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none animate-pulse"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-xl transition-all duration-300 hover:scale-105"
              onClick={() => setIsEditingBoardTitle(true)}
            >
              {currentBoard.title}
            </h1>
          )}
        </div>

        <div className="flex items-start gap-6 overflow-x-auto custom-scrollbar pb-6 px-1">
          <SortableContext
            items={currentBoard.lists.map((list) => list.id)}
            strategy={horizontalListSortingStrategy}
          >
            {currentBoard.lists.map((list, index) => (
              <div key={list.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <SortableList list={list} boardId={currentBoard.id} />
              </div>
            ))}
          </SortableContext>

          {/* Add List */}
          <div className="flex-shrink-0 w-80">
            {isAddingList ? (
              <div className="glass rounded-lg p-4 shadow-lg space-y-3">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                  placeholder={t('placeholder.listName')}
                  className="input-base"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleAddList} className="btn-primary">
                    {t('action.create')}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                    }}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full glass rounded-lg p-4 shadow-lg flex items-center justify-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-400 dark:hover:border-primary-600 border-2 border-dashed border-slate-300 dark:border-slate-600 transition-all duration-200 group"
              >
                <Plus className="w-6 h-6 text-slate-700 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:scale-110 transition-all" />
                <span className="font-semibold text-slate-700 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {t('board.addList')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-80 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        )}
        {activeList && (
          <div className="w-80 opacity-90">
            <TaskList list={activeList} boardId={currentBoard.id} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
