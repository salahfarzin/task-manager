import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Bot, Sparkles, Code2, ShieldCheck, Briefcase, CheckCircle, XCircle, GitBranch, FileCode, ClipboardList } from 'lucide-react';
import type { Task } from '../store/task-store';

interface AiPipelineResultsProps {
  task: Task;
}

export const AiPipelineResults: React.FC<AiPipelineResultsProps> = ({ task }) => {
  const { t } = useTranslation();

  const statusBadge = () => {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
      queued:       { label: t('ai.status.queued'),       cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',        icon: <Bot className="w-3.5 h-3.5" /> },
      enriching:    { label: t('ai.status.enriching'),    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" /> },
      implementing: { label: t('ai.status.implementing'), cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Code2 className="w-3.5 h-3.5 animate-pulse" /> },
      qa_review:    { label: t('ai.status.qa_review'),    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> },
      po_review:    { label: t('ai.status.po_review'),    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: <Briefcase className="w-3.5 h-3.5 animate-pulse" /> },
      approved:     { label: t('ai.status.approved'),     cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',    icon: <CheckCircle className="w-3.5 h-3.5" /> },
      rejected:     { label: t('ai.status.rejected'),     cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',            icon: <XCircle className="w-3.5 h-3.5" /> },
    };
    const s = task.aiStatus ? map[task.aiStatus] : null;
    if (!s) {
      return null;
    }
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
        {s.icon}{s.label}
      </span>
    );
  };

  const hasAnyResult = !!(
    task.enrichedTitle || task.enrichedDescription || task.acceptanceCriteria ||
    task.branchName || task.changedFiles?.length || task.qaFeedback || task.poFeedback
  );

  return (
    <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-4 h-4" />
          {t('ai.pipelineResults')}
        </span>
        {statusBadge()}
      </div>

      {hasAnyResult && (
        <div className="divide-y divide-indigo-100 dark:divide-indigo-900/40">

          {/* Enricher output */}
          {(task.enrichedTitle || task.enrichedDescription) && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />{t('ai.agent.enricher')}
              </p>
              {task.enrichedTitle && task.enrichedTitle !== task.title && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('ai.enrichedTitle')}</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.enrichedTitle}</p>
                </div>
              )}
              {task.enrichedDescription && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-1
                  prose-headings:text-indigo-700 dark:prose-headings:text-indigo-300
                  prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:my-0.5
                  prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-0
                  prose-ul:my-1 prose-strong:text-slate-800 dark:prose-strong:text-slate-200">
                  <ReactMarkdown>{task.enrichedDescription}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Spec output */}
          {task.acceptanceCriteria && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />{t('ai.agent.spec')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('ai.acceptanceCriteria')}</p>
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">{task.acceptanceCriteria}</pre>
            </div>
          )}

          {/* Developer output */}
          {(task.branchName || task.changedFiles?.length) && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />{t('ai.agent.developer')}
              </p>
              {task.branchName && (
                <div className="flex items-center gap-1.5 text-sm font-mono text-indigo-700 dark:text-indigo-300">
                  <GitBranch className="w-4 h-4 flex-shrink-0" />
                  {task.branchName}
                </div>
              )}
              {task.changedFiles && task.changedFiles.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />{t('ai.changedFiles')} ({task.changedFiles.length})
                  </p>
                  <div className="space-y-1">
                    {task.changedFiles.map((f) => {
                      const spaceIdx = f.indexOf(' ');
                      const hasStatus = spaceIdx === 1 && /^[AMDR]$/.test(f[0]);
                      const status = hasStatus ? f[0] : 'M';
                      const path = hasStatus ? f.slice(2) : f;
                      const badgeStyles: Record<string, string> = {
                        A: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
                        M: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                        D: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
                        R: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                      };
                      return (
                        <div key={f} className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5">
                          <span className={`shrink-0 rounded px-1 font-bold text-[10px] leading-4 ${badgeStyles[status] ?? badgeStyles['M']}`}>{status}</span>
                          <span className="truncate">{path}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QA output */}
          {task.qaFeedback && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />{t('ai.agent.qa')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.qaFeedback}</p>
            </div>
          )}

          {/* PO output */}
          {task.poFeedback && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />{t('ai.agent.po')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.poFeedback}</p>
            </div>
          )}

        </div>
      )}

      {!hasAnyResult && (
        <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          {t('ai.pipelineInProgress')}
        </div>
      )}
    </div>
  );
};
