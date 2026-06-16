import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Plus, Trash2, Settings, FolderOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTaskStore, type Board, type BoardSettings, type Microservice } from '@/store/task-store';
import { CONFIGS } from '@/config';
import { Button, Input, FormField, RepoPathInput } from '@/components/form';

interface BoardSettingsModalProps {
    board: Board;
    onClose: () => void;
}

const DEFAULT_SETTINGS: BoardSettings = {
    repoPath: '',
    agentUrl: CONFIGS.AGENT_URL,
    microservices: [],
    branchMaxLength: 128,
    testCommand: '',
};

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({ board, onClose }) => {
    const { t } = useTranslation();
    const { updateBoardSettings } = useTaskStore();

    const [repoPath, setRepoPath] = useState(board.settings?.repoPath ?? DEFAULT_SETTINGS.repoPath);
    const [agentUrl, setAgentUrl] = useState(board.settings?.agentUrl ?? DEFAULT_SETTINGS.agentUrl);
    const [branchMaxLength, setBranchMaxLength] = useState(
        board.settings?.branchMaxLength ?? DEFAULT_SETTINGS.branchMaxLength
    );
    const [testCommand, setTestCommand] = useState(board.settings?.testCommand ?? DEFAULT_SETTINGS.testCommand);
    const [microservices, setMicroservices] = useState<Microservice[]>(
        board.settings?.microservices ?? DEFAULT_SETTINGS.microservices
    );

    // Sync when board changes (depends on board so exhaustive-deps is satisfied;
    // typing only updates local state, not the store, so this won't reset mid-edit)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRepoPath(board.settings?.repoPath ?? DEFAULT_SETTINGS.repoPath);
        setAgentUrl(board.settings?.agentUrl ?? DEFAULT_SETTINGS.agentUrl);
        setBranchMaxLength(board.settings?.branchMaxLength ?? DEFAULT_SETTINGS.branchMaxLength);
        setTestCommand(board.settings?.testCommand ?? DEFAULT_SETTINGS.testCommand);
        setMicroservices(board.settings?.microservices ?? DEFAULT_SETTINGS.microservices);
    }, [board]);

    const handleSave = () => {
        updateBoardSettings(board.id, { repoPath, agentUrl, microservices, branchMaxLength, testCommand });
        onClose();
    };

    const addMicroservice = () => {
        setMicroservices((prev) => [
            ...prev,
            { id: uuidv4(), name: '', url: '', repoPath: '', description: '' },
        ]);
    };

    const updateMicroservice = (id: string, field: keyof Omit<Microservice, 'id'>, value: string) => {
        setMicroservices((prev) =>
            prev.map((ms) => (ms.id === id ? { ...ms, [field]: value } : ms))
        );
    };

    const removeMicroservice = (id: string) => {
        setMicroservices((prev) => prev.filter((ms) => ms.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={t('board.settings.title')}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            {t('board.settings.title')}
                        </h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-32">
                            — {board.title}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        aria-label={t('action.close')}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Repo path */}
                    <FormField
                        label={<><FolderOpen className="w-4 h-4 inline-block ltr:mr-1.5 rtl:ml-1.5" />{t('board.settings.repoPath')}</>}
                        hint={t('board.settings.repoPathHint')}
                    >
                        <RepoPathInput value={repoPath} onChange={setRepoPath} />
                    </FormField>

                    {/* Agent service URL */}
                    <FormField
                        label={<><Globe className="w-4 h-4 inline-block ltr:mr-1.5 rtl:ml-1.5" />{t('board.settings.agentUrl')}</>}
                        hint={t('board.settings.agentUrlHint')}
                    >
                        <Input
                            type="text"
                            className="font-mono text-sm"
                            value={agentUrl}
                            onChange={(e) => setAgentUrl(e.target.value)}
                            placeholder="http://localhost:8004"
                            spellCheck={false}
                        />
                    </FormField>

                    {/* Branch name max length */}
                    <FormField
                        label={t('board.settings.branchMaxLength')}
                        hint={t('board.settings.branchMaxLengthHint')}
                    >
                        <Input
                            type="number"
                            className="w-28 font-mono text-sm"
                            value={branchMaxLength}
                            onChange={(e) => setBranchMaxLength(Math.max(20, Math.min(255, Number(e.target.value))))}
                            min={20}
                            max={255}
                        />
                    </FormField>

                    {/* Test command */}
                    <FormField
                        label={t('board.settings.testCommand')}
                        hint={t('board.settings.testCommandHint')}
                    >
                        <Input
                            type="text"
                            className="font-mono text-sm"
                            value={testCommand}
                            onChange={(e) => setTestCommand(e.target.value)}
                            placeholder="composer test"
                            spellCheck={false}
                        />
                    </FormField>

                    {/* Microservices */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('board.settings.microservices')}
                            </label>
                            <Button
                                variant="ghost"
                                onClick={addMicroservice}
                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('board.settings.addMicroservice')}
                            </Button>
                        </div>

                        {microservices.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                                {t('board.settings.noMicroservices')}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {microservices.map((ms) => (
                                    <div key={ms.id}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50 dark:bg-slate-800/50"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <Input
                                                    className="text-sm py-1 px-2"
                                                    value={ms.name}
                                                    onChange={(e) => updateMicroservice(ms.id, 'name', e.target.value)}
                                                    placeholder={t('board.settings.msName')}
                                                />
                                                <Input
                                                    className="text-sm py-1 px-2 font-mono"
                                                    value={ms.url}
                                                    onChange={(e) => updateMicroservice(ms.id, 'url', e.target.value)}
                                                    placeholder="http://localhost:3001"
                                                    spellCheck={false}
                                                />
                                            </div>
                                            <Button
                                                variant="danger"
                                                onClick={() => removeMicroservice(ms.id)}
                                                className="flex-shrink-0 mt-0.5"
                                                aria-label={t('board.settings.removeMicroservice')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <RepoPathInput
                                            value={ms.repoPath}
                                            onChange={(v) => updateMicroservice(ms.id, 'repoPath', v)}
                                            placeholder="github.com/user/service  or  /local/path  (optional)"
                                            className="w-full"
                                        />
                                        <Input
                                            className="text-sm py-1 px-2 w-full"
                                            value={ms.description}
                                            onChange={(e) => updateMicroservice(ms.id, 'description', e.target.value)}
                                            placeholder={t('board.settings.msDescription')}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={onClose}>
                        {t('action.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {t('action.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
