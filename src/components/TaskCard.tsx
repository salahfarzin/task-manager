import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Paperclip, Tag, X, Calendar, User, Clock, Bot } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import type { Task, AiStatus } from '../store/task-store';
import { useTaskStore } from '../store/task-store';
import { FileUpload } from './FileUpload';
import { TaskEditModal } from './TaskEditModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const { updateTask, deleteTask, removeAttachment, queueTaskForAI } = useTaskStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
    }
  };

  const handleSendToAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    queueTaskForAI(task.id);
  };

  const getAiStatusStyle = (status: AiStatus): string => {
    const styles: Record<AiStatus, string> = {
      idle: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      queued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      enriching: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      implementing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      qa_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      po_review: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return styles[status];
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

  const getDueDateColor = () => {
    if (!task.dueDate) return '';
    if (isPast(task.dueDate) && !isToday(task.dueDate)) return 'text-red-700 dark:text-red-400';
    if (isToday(task.dueDate)) return 'text-orange-700 dark:text-orange-400';
    if (isTomorrow(task.dueDate)) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-slate-700 dark:text-slate-400';
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        data-testid="task-card"
        className={`glass rounded-xl p-4 mb-3 card-hover animate-scale-in ${
          isDragging ? 'shadow-2xl' : 'shadow-md'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex-1">
              {task.title}
            </h3>
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              {(!task.aiStatus || task.aiStatus === 'idle') && (
                <button
                  onClick={handleSendToAI}
                  className="p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 group hover:scale-110"
                  aria-label={t('ai.sendToAI')}
                  data-testid="send-to-ai-button"
                >
                  <Bot className="w-4 h-4 text-slate-700 dark:text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 group hover:scale-110"
                aria-label={t('task.edit')}
              >
                <Edit className="w-4 h-4 text-slate-700 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group hover:scale-110"
                aria-label={t('task.delete')}
                data-testid="delete-task-button"
              >
                <Trash2 className="w-4 h-4 text-slate-700 dark:text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>

          {task.aiStatus && task.aiStatus !== 'idle' && (
            <div className="animate-fade-in">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getAiStatusStyle(task.aiStatus)}`}
                data-testid="ai-status-badge"
              >
                <Bot className="w-3 h-3" />
                {t(`ai.status.${task.aiStatus}`)}
              </span>
            </div>
          )}
          {task.description && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none animate-fade-in cursor-pointer hover:opacity-80 transition-opacity"
              dangerouslySetInnerHTML={{ __html: task.description }}
              onClick={() => setIsModalOpen(true)}
            />
          )}

          {/* Tags */}
          <div className="space-y-2">
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {task.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`tag ${getTagColor(index)} group cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <Tag className="w-3 h-3 inline-block ltr:mr-1 rtl:ml-1" />
                    {tag}
                    <X className="w-3 h-3 inline-block ltr:ml-1 rtl:mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={t('task.addTag')}
                className="input-base text-sm flex-1"
              />
            </div>
          </div>

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center">
                <Paperclip className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                {t('task.attachments')}
              </p>
              <div className="space-y-1">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse flex-1 min-w-0">
                      <Paperclip className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{attachment.name}</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        ({(attachment.size / 1024).toFixed(1)}KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeAttachment(task.id, attachment.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors hover:scale-110"
                      data-testid={`delete-attachment-${attachment.id}`}
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Toggle */}
          <div>
            {showFileUpload ? (
              <FileUpload
                taskId={task.id}
                onClose={() => setShowFileUpload(false)}
              />
            ) : (
              <button
                onClick={() => setShowFileUpload(true)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center space-x-1 rtl:space-x-reverse hover:scale-105 transition-transform"
                data-testid="toggle-file-upload"
              >
                <Paperclip className="w-4 h-4" />
                <span>{t('task.addAttachment')}</span>
              </button>
            )}
          </div>

          {/* Members */}
          {task.mentions.length > 0 && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse animate-fade-in">
              <User className="w-4 h-4 text-slate-700 dark:text-slate-400" />
              <div className="flex -space-x-1">
                {task.mentions.map((mention, index) => (
                  <div
                    key={mention}
                    className="w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform"
                    title={mention}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {mention.replace(/^@/, '').charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div 
              data-testid="due-date" 
              className={`flex items-center space-x-2 rtl:space-x-reverse text-sm ${getDueDateColor()} animate-fade-in`}
            >
              <Calendar className="w-4 h-4" />
              <span>{format(task.dueDate, 'MMM dd, yyyy')}</span>
            </div>
          )}

          {/* Estimation & Assignee */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {task.estimation && (task.estimation > 0) && (
              <div 
                data-testid="task-estimation"
                className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-slate-600 dark:text-slate-400"
                title={t('task.estimation')}
              >
                <Clock className="w-4 h-4" />
                <span>{task.estimation}h</span>
              </div>
            )}
            
            {task.assignee && (
              <div 
                data-testid="task-assignee"
                className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-slate-600 dark:text-slate-400"
              >
                <div 
                  className="w-6 h-6 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800"
                  title={task.assignee}
                >
                  {task.assignee.charAt(0).toUpperCase()}
                </div>
                <span>{task.assignee}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
            {t('task.createdAt')}: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Task Edit Modal - Rendered via portal to avoid drag conflicts */}
      {createPortal(
        <TaskEditModal
          taskId={task.id}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
};
