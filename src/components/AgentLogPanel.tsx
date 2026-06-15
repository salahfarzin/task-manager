import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, ChevronDown, ChevronUp, GitBranch, FileCode } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../store/task-store';

interface AgentLogPanelProps {
  task: Task;
}

export const AgentLogPanel: React.FC<AgentLogPanelProps> = ({ task }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!task.aiAgentLog || task.aiAgentLog.length === 0) {
    return null;
  }

  const agentStatusColors: Record<string, string> = {
    started: 'text-blue-600 dark:text-blue-400',
    completed: 'text-green-600 dark:text-green-400',
    failed: 'text-red-600 dark:text-red-400',
  };

  return (
    <div
      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
      data-testid="agent-log-panel"
    >
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-500" />
          {t('ai.agentLog')}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({task.aiAgentLog.length})
          </span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto custom-scrollbar">
          {task.aiAgentLog.map((entry) => (
            <div
              key={entry.id}
              className="px-4 py-2.5 text-sm space-y-1.5"
              data-testid="agent-log-entry"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap pt-0.5 min-w-[70px]">
                  {format(new Date(entry.timestamp), 'HH:mm:ss')}
                </span>
                <span className="font-medium text-slate-600 dark:text-slate-300 min-w-[80px]">
                  {t(`ai.agent.${entry.agent}`)}
                </span>
                <span className={`font-medium min-w-[64px] ${agentStatusColors[entry.status] ?? ''}`}>
                  {entry.status}
                </span>
                <span className="text-slate-600 dark:text-slate-400 flex-1">
                  {entry.message}
                </span>
              </div>

              {/* Branch name — shown on developer completed */}
              {entry.agent === 'developer' && entry.status === 'completed' && task.branchName && (
                <div className="ms-[166px] flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                  <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                  {task.branchName}
                </div>
              )}

              {/* Changed files — shown on developer completed */}
              {entry.agent === 'developer' && entry.status === 'completed' && task.changedFiles && task.changedFiles.length > 0 && (
                <div className="ms-[166px] space-y-0.5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    {t('ai.changedFiles')} ({task.changedFiles.length})
                  </p>
                  <ul className="space-y-0.5">
                    {task.changedFiles.map((file) => (
                      <li key={file} className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 truncate">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
