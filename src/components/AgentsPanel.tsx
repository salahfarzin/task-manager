import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, X, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react';
import { useTaskStore, type AgentConfig, type AgentRole } from '@/store/task-store';
import { Button, Input, Textarea } from '@/components/form';

interface AgentCardProps {
    agent: AgentConfig;
    onUpdate: (id: AgentRole, updates: Partial<Omit<AgentConfig, 'id'>>) => void;
}

const AgentCard = ({ agent, onUpdate }: AgentCardProps) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(agent.name);
    const [role, setRole] = useState(agent.role);
    const [goal, setGoal] = useState(agent.goal);
    const [description, setDescription] = useState(agent.description);

    const handleSave = () => {
        onUpdate(agent.id, { name, role, goal, description });
        setEditing(false);
    };

    const handleCancel = () => {
        setName(agent.name);
        setRole(agent.role);
        setGoal(agent.goal);
        setDescription(agent.description);
        setEditing(false);
    };

    return (
        <div className={`rounded-xl border transition-all duration-200 ${
            agent.enabled
                ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60'
        }`}>
            {/* Card header */}
            <div className="flex items-center gap-3 p-3">
                <div className={`w-8 h-8 rounded-lg ${agent.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                    {agent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    {editing ? (
                        <Input
                            className="text-sm py-0.5 px-2 w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{agent.name}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('agents.id.' + agent.id)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => onUpdate(agent.id, { enabled: !agent.enabled })}
                        title={agent.enabled ? t('agents.disable') : t('agents.enable')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            agent.enabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            agent.enabled ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                    </button>
                    {editing ? (
                        <>
                            <Button variant="ghost" onClick={handleSave} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" onClick={handleCancel}>
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => { setEditing(true); setExpanded(true); }} className="hover:text-primary-600">
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" onClick={() => setExpanded((v) => !v)}>
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Expanded details / edit form */}
            {expanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2 animate-fade-in">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('agents.role')}</p>
                        {editing ? (
                            <Input className="text-sm py-1 px-2 w-full" value={role} onChange={(e) => setRole(e.target.value)} />
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300">{agent.role}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('agents.goal')}</p>
                        {editing ? (
                            <Input className="text-sm py-1 px-2 w-full" value={goal} onChange={(e) => setGoal(e.target.value)} />
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300">{agent.goal}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('agents.description')}</p>
                        {editing ? (
                            <Textarea className="text-sm py-1 px-2 w-full" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{agent.description}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface AgentsPanelProps {
    open: boolean;
    onClose: () => void;
}

export const AgentsPanel = ({ open, onClose }: AgentsPanelProps) => {
    const { t } = useTranslation();
    const { agents, updateAgent } = useTaskStore();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-label={t('agents.title')}
                className="fixed top-0 end-0 h-full w-80 max-w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col animate-slide-in border-s border-slate-200 dark:border-slate-700"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('agents.title')}</h2>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        aria-label={t('action.close')}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Agent list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('agents.subtitle')}</p>
                    {agents.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} onUpdate={updateAgent} />
                    ))}
                </div>
            </div>
        </>
    );
};
