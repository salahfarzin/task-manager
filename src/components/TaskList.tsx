import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import type { List } from '../store/task-store';
import { useTaskStore } from '../store/task-store';
import { TaskCard } from './TaskCard';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface TaskListProps {
  list: List;
  boardId: string;
}

export const TaskList: React.FC<TaskListProps> = ({ list, boardId }) => {
  const { t, i18n } = useTranslation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const { addTask, deleteList, updateList } = useTaskStore();

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      updateList(boardId, list.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setEditedTitle(list.title);
      setIsEditingTitle(false);
    }
  };

  const { setNodeRef } = useDroppable({ id: list.id });

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(boardId, list.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleDeleteList = () => {
    if (window.confirm(`Delete "${list.title}"?`)) {
      deleteList(boardId, list.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="glass rounded-xl p-4 shadow-lg h-full flex flex-col animate-scale-in">
        {/* List Header */}
        <div className="flex items-center justify-between mb-4">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="font-bold text-lg bg-transparent border-b-2 border-primary-500 focus:outline-none w-full animate-pulse"
              autoFocus
            />
          ) : (
            <h2 
              className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors group"
              onClick={() => setIsEditingTitle(true)}
            >
              {i18n.language === 'fa' ? (
                <>
                  <span className="me-2 text-sm font-normal text-slate-700 dark:text-slate-300">
                    ({list.tasks.length})
                  </span>
                  {list.title}
                </>
              ) : (
                <>
                  {list.title}
                  <span className="ms-2 text-sm font-normal text-slate-700 dark:text-slate-300">
                    ({list.tasks.length})
                  </span>
                </>
              )}
            </h2>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-slate-700 dark:text-slate-400" />
            </button>
            
            {showMenu && (
              <div className="absolute top-full end-0 mt-1 glass rounded-xl shadow-xl p-2 min-w-[150px] z-10 animate-slide-in">
                <button
                  onClick={handleDeleteList}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{t('board.deleteList')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-3"
        >
          <SortableContext
            items={list.tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks.map((task, index) => (
              <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <TaskCard task={task} />
              </div>
            ))}
          </SortableContext>
        </div>

        {/* Add Task */}
        {isAddingTask ? (
          <div className="mt-3 space-y-2 animate-slide-in">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder={t('placeholder.taskTitle')}
              className="input-base"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button onClick={handleAddTask} className="btn-primary">
                {t('action.create')}
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
                className="btn-secondary"
              >
                {t('action.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-slate-700 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 group hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{t('board.addCard')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
