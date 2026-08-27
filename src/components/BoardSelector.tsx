import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, X } from 'lucide-react';
import { useTaskStore } from '../store/task-store';

export const BoardSelector: React.FC = () => {
  const { t } = useTranslation();
  const { boards, currentBoardId, selectBoard, addBoard, deleteBoard } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBoard = boards.find(b => b.id === currentBoardId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddBoard = () => {
    if (newBoardTitle.trim()) {
      addBoard(newBoardTitle.trim());
      setNewBoardTitle('');
      setIsAddingBoard(false);
    }
  };

  const handleDeleteBoard = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (boards.length > 1) {
      deleteBoard(boardId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {currentBoard?.title || 'Select Board'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="p-2">
            {boards.map((board) => (
              <div
                key={board.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  board.id === currentBoardId ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
                onClick={() => {
                  selectBoard(board.id);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {board.title}
                </span>
                {boards.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteBoard(board.id, e)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    aria-label={`Delete board ${board.title}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
              {isAddingBoard ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddBoard();
                      if (e.key === 'Escape') {
                        setNewBoardTitle('');
                        setIsAddingBoard(false);
                      }
                    }}
                    placeholder={t('board.new.placeholder')}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    onClick={handleAddBoard}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    aria-label="Add board"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingBoard(true)}
                  className="flex items-center space-x-2 rtl:space-x-reverse w-full p-3 text-start text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('board.new.label')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};