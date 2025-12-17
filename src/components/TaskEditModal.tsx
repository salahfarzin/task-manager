import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Calendar, Tag, Paperclip, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../store/taskStore';
import { useTaskStore } from '../store/taskStore';
import { RichTextEditor } from './RichTextEditor';
import { FileUpload } from './FileUpload';

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [newTag, setNewTag] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [dueDate, setDueDate] = useState(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');

  const { updateTask, deleteTask, removeAttachment } = useTaskStore();

  // Sync state when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
  }, [task]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updates: Partial<Task> = { title, description };
    if (dueDate) {
      updates.dueDate = new Date(dueDate);
    } else {
      updates.dueDate = undefined;
    }
    updateTask(task.id, updates);
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      updateTask(task.id, { tags: [...task.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask(task.id, { tags: task.tags.filter((tag) => tag !== tagToRemove) });
  };

  const handleDelete = () => {
    if (window.confirm(t('task.delete') + '?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('task.edit')}
          </h2>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
              aria-label={t('task.delete')}
            >
              <Trash2 className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-red-600 transition-colors" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              aria-label={t('action.close')}
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('task.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base text-lg font-semibold"
              placeholder={t('placeholder.taskTitle')}
              autoFocus
            />
          </div>

          {/* Description - The main focus with more room! */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('task.description')}
            </label>
            <div className="min-h-[200px]">
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder={t('task.addDescription')}
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline-block ltr:mr-2 rtl:ml-2" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Tag className="w-4 h-4 inline-block ltr:mr-2 rtl:ml-2" />
              {t('task.tags')}
            </label>
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {task.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`tag ${getTagColor(index)} group cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 inline-block ltr:ml-1 rtl:mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={t('task.addTag')}
              className="input-base"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Paperclip className="w-4 h-4 inline-block ltr:mr-2 rtl:ml-2" />
              {t('task.attachments')}
            </label>
            {task.attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 flex-shrink-0 text-slate-500" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{attachment.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(attachment.size / 1024).toFixed(1)}KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeAttachment(task.id, attachment.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showFileUpload ? (
              <FileUpload taskId={task.id} onClose={() => setShowFileUpload(false)} />
            ) : (
              <button
                onClick={() => setShowFileUpload(true)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-2 rtl:space-x-reverse hover:scale-105 transition-transform"
              >
                <Paperclip className="w-4 h-4" />
                <span>{t('task.addAttachment')}</span>
              </button>
            )}
          </div>

          {/* Members/Mentions */}
          {task.mentions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User className="w-4 h-4 inline-block ltr:mr-2 rtl:ml-2" />
                {t('task.mentions')}
              </label>
              <div className="flex -space-x-2">
                {task.mentions.map((mention) => (
                  <div
                    key={mention}
                    className="w-8 h-8 bg-primary-500 text-white text-sm rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform"
                    title={mention}
                  >
                    {mention.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
            {t('task.createdAt')}: {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="btn-base btn-secondary flex items-center space-x-2 rtl:space-x-reverse"
          >
            <X className="w-4 h-4" />
            <span>{t('action.cancel')}</span>
          </button>
          <button
            onClick={handleSave}
            className="btn-base btn-primary flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Save className="w-4 h-4" />
            <span>{t('action.save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
