import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Paperclip, Tag, X, Calendar, User, Clock, Bot, GitBranch, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import type { Task, AgentLogEntry, AgentRole, AiStatus } from '../store/task-store';
import { useTaskStore } from '../store/task-store';
import { CONFIGS } from '../config';
import { FileUpload } from '@/components/form';
import { TaskEditModal } from './TaskEditModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ACTIVE_AI_STATUSES = new Set<AiStatus>([
  'queued',
  'enriching',
  'implementing',
  'qa_review',
  'po_review',
]);

// Maps each active pipeline status to the agent currently responsible
const STATUS_TO_AGENT: Partial<Record<AiStatus, AgentRole>> = {
  enriching: 'enricher',
  implementing: 'developer',
  qa_review: 'qa',
  po_review: 'po',
};

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  
  const { updateTask, deleteTask, removeAttachment, queueTaskForAI, agents, boards, currentBoardId } = useTaskStore();
  const currentBoard = boards.find((b) => b.id === currentBoardId);
  const agentUrl = currentBoard?.settings?.agentUrl ?? CONFIGS.AGENT_URL;

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

  useEffect(() => {
    if (!task.aiStatus || !ACTIVE_AI_STATUSES.has(task.aiStatus)) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${agentUrl}/api/tasks/${task.id}/status`);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const log: AgentLogEntry[] = (data.log ?? []).map(
          (entry: { agent: AgentRole; status: string; message: string }, idx: number) => ({
            id: `${task.id}-log-${idx}`,
            timestamp: new Date(),
            agent: entry.agent,
            status: entry.status as AgentLogEntry['status'],
            message: entry.message,
          }),
        );

        const updates: Parameters<typeof updateTask>[1] = {
          aiStatus: data.status,
          aiAgentLog: log,
        };

        if (data.enriched_title) {
          updates.enrichedTitle = data.enriched_title;
        }
        if (data.enriched_description) {
          updates.enrichedDescription = data.enriched_description;
        }
        if (data.acceptance_criteria) {
          updates.acceptanceCriteria = data.acceptance_criteria;
        }
        if (data.branch_name) {
          updates.branchName = data.branch_name;
        }
        if (data.changed_files?.length) {
          updates.changedFiles = data.changed_files;
        }
        if (data.qa_feedback) {
          updates.qaFeedback = data.qa_feedback;
        }
        if (data.po_feedback) {
          updates.poFeedback = data.po_feedback;
        }

        // Auto-assign to the agent currently handling the task
        const activeAgent = STATUS_TO_AGENT[data.status as AiStatus];
        if (activeAgent) {
          updates.assignee = activeAgent;
        }

        updateTask(task.id, updates);
      } catch {
        // ignore transient network errors during polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [task.aiStatus, task.id, updateTask, agentUrl]);

  const handleSendToAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    queueTaskForAI(task.id);
    // Immediately reflect that the enricher is starting
    updateTask(task.id, { assignee: 'enricher' });
    try {
      await fetch(`${agentUrl}/api/tasks/${task.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          title: task.title,
          description: task.description,
          tags: task.tags,
          repo_path: currentBoard?.settings?.repoPath || undefined,
          microservices: (currentBoard?.settings?.microservices ?? []).map((ms) => ({
            id: ms.id,
            name: ms.name,
            url: ms.url,
            repo_path: ms.repoPath || undefined,
            description: ms.description,
          })),
          agent_configs: agents.filter((a) => a.enabled).map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            goal: a.goal,
            description: a.description,
          })),
        }),
      });
    } catch {
      // agent service may not be running; task stays queued in the UI
    }
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
              {(!task.aiStatus || task.aiStatus === 'idle' || task.aiStatus === 'approved' || task.aiStatus === 'rejected') && (
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

          {/* AI pipeline results */}
          {(task.enrichedTitle || task.branchName || task.acceptanceCriteria) && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-3 space-y-2 animate-fade-in text-sm">
              {task.enrichedTitle && task.enrichedTitle !== task.title && (
                <div>
                  <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mb-0.5">
                    <Sparkles className="w-3 h-3" />
                    {t('ai.enrichedTitle')}
                  </p>
                  <p className="text-slate-800 dark:text-slate-100 font-medium leading-snug">
                    {task.enrichedTitle}
                  </p>
                </div>
              )}
              {task.branchName && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-mono">
                  <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{task.branchName}</span>
                </div>
              )}
              {task.acceptanceCriteria && (
                <div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowCriteria((v) => !v); }}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors cursor-pointer"
                  >
                    {showCriteria ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {t('ai.acceptanceCriteria')}
                  </button>
                  {showCriteria && (
                    <pre className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {task.acceptanceCriteria}
                    </pre>
                  )}
                </div>
              )}
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
            
            {task.assignee && (() => {
              const agent = agents.find((a) => a.id === task.assignee);
              const displayName = agent ? agent.name : task.assignee;
              const initial = displayName.charAt(0).toUpperCase();
              const colorClass = agent ? agent.color : 'bg-purple-500';
              const isAiActive = !!task.aiStatus && ACTIVE_AI_STATUSES.has(task.aiStatus) && !!STATUS_TO_AGENT[task.aiStatus];
              return (
                <div
                  data-testid="task-assignee"
                  className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-slate-600 dark:text-slate-400"
                >
                  <div className="relative">
                    <div
                      className={`w-6 h-6 ${colorClass} text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800`}
                      title={agent ? `${agent.name} — ${agent.role}` : displayName}
                    >
                      {initial}
                    </div>
                    {isAiActive && (
                      <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                    )}
                  </div>
                  <span>{displayName}</span>
                  {isAiActive && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('ai.working')}</span>
                  )}
                </div>
              );
            })()}
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
